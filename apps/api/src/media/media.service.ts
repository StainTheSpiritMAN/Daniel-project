import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MediaKind, Prisma, type Media } from '@prisma/client';
import { execFile } from 'child_process';
import { randomBytes } from 'crypto';
import { promises as fs } from 'fs';
import { join, parse } from 'path';
import sharp from 'sharp';
import { promisify } from 'util';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { AppConfig } from '../config/configuration';
import { detectFileType, MAX_BYTES, UnsupportedFileError, type DetectedType } from './file-signature';

const run = promisify(execFile);

const ORIGINAL_MAX = 2560;
const QUALITY = 82;
const SIZES = { lg: 1920, md: 1280, thumb: 480 } as const;

export type Rendition = { path: string; width: number; height: number; webp?: string };
export type MediaVariants = Partial<Record<keyof typeof SIZES, Rendition>> & {
  poster?: string;
  /** Square PNG favicon sizes, created when the image is chosen as site icon. */
  icon?: Record<string, string>;
};

const ICON_SIZES = [32, 180, 192, 512];

export type IngestInput = {
  /** Path to the uploaded file on local disk (it is not modified). */
  sourcePath: string;
  originalName: string;
  alt?: string;
  uploadedById?: string | null;
};

const slugify = (name: string) =>
  parse(name)
    .name.toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'file';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private ffmpegAvailable?: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  private get uploads() {
    return this.config.get('uploads', { infer: true });
  }

  /** Public URL path → absolute path on disk. */
  private toDisk(publicPath: string) {
    return join(this.uploads.dir, publicPath.slice(this.uploads.publicPath.length));
  }

  async ingest({ sourcePath, originalName, alt = '', uploadedById }: IngestInput) {
    const handle = await fs.open(sourcePath, 'r');
    const head = Buffer.alloc(16);
    let size: number;
    try {
      await handle.read(head, 0, 16, 0);
      size = (await handle.stat()).size;
    } finally {
      await handle.close();
    }

    let type: DetectedType | null;
    try {
      type = detectFileType(head);
    } catch (error) {
      if (error instanceof UnsupportedFileError) throw new BadRequestException(error.message);
      throw error;
    }
    if (!type) {
      throw new BadRequestException(
        'Unsupported file type. Allowed: JPG, PNG, WebP, MP4, WebM, PDF.',
      );
    }
    if (size > MAX_BYTES[type.kind]) {
      throw new PayloadTooLargeException(
        `${type.kind.toLowerCase()} files must be under ${MAX_BYTES[type.kind] / 1024 / 1024} MB.`,
      );
    }

    const now = new Date();
    const folder = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`;
    const base = `${slugify(originalName)}-${randomBytes(3).toString('hex')}`;
    const publicDir = `${this.uploads.publicPath}/${folder}`;
    await fs.mkdir(join(this.uploads.dir, folder), { recursive: true });

    let width: number | null = null;
    let height: number | null = null;
    let variants: MediaVariants = {};
    const mainPath = `${publicDir}/${base}.${type.ext}`;

    let media: Media;
    try {
      if (type.kind === 'IMAGE') {
        ({ width, height, variants } = await this.processImage(sourcePath, type.ext, publicDir, base));
      } else {
        await fs.copyFile(sourcePath, this.toDisk(mainPath));
        if (type.kind === 'VIDEO') {
          const poster = await this.extractPoster(this.toDisk(mainPath), `${publicDir}/${base}-poster.jpg`);
          if (poster) variants = { poster };
        }
      }

      media = await this.prisma.media.create({
        data: {
          filename: parse(originalName).name.slice(0, 120) || base,
          path: mainPath,
          mimeType: type.mime,
          kind: type.kind,
          alt: alt.trim(),
          width,
          height,
          sizeBytes: size,
          variants: variants as Prisma.InputJsonValue,
          uploadedById: uploadedById ?? null,
        },
      });
    } catch (error) {
      // Every file from this upload starts with the unique `base`; remove
      // whatever was written so failed uploads leave nothing behind.
      const dir = join(this.uploads.dir, folder);
      const leftovers = (await fs.readdir(dir)).filter((f) => f.startsWith(`${base}.`) || f.startsWith(`${base}-`));
      await Promise.all(leftovers.map((f) => fs.rm(join(dir, f), { force: true })));
      throw error;
    }
    await this.audit.log(uploadedById ?? null, 'UPLOAD', 'Media', media.id, {
      filename: media.filename,
      kind: media.kind,
    });
    return media;
  }

  private async processImage(source: string, ext: string, publicDir: string, base: string) {
    try {
      return await this.renderImage(source, ext, publicDir, base);
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.warn(`Image processing failed: ${(error as Error).message}`);
      throw new BadRequestException('This image could not be read — it may be damaged. Try exporting it again.');
    }
  }

  private async renderImage(source: string, ext: string, publicDir: string, base: string) {
    // `.rotate()` applies EXIF orientation; sharp drops all metadata (GPS etc.)
    // on output because `.withMetadata()` is never called.
    const input = sharp(source, { failOn: 'error' }).rotate();
    const meta = await input.metadata();
    if (!meta.width || !meta.height) {
      throw new BadRequestException('Could not read image dimensions.');
    }

    const encode = (img: sharp.Sharp) =>
      ext === 'png'
        ? img.png({ compressionLevel: 9 })
        : ext === 'webp'
          ? img.webp({ quality: QUALITY })
          : img.jpeg({ quality: QUALITY, mozjpeg: true });

    const original = await encode(
      input.clone().resize({ width: ORIGINAL_MAX, height: ORIGINAL_MAX, fit: 'inside', withoutEnlargement: true }),
    ).toFile(this.toDisk(`${publicDir}/${base}.${ext}`));

    const variants: MediaVariants = {};
    for (const [size, maxW] of Object.entries(SIZES) as [keyof typeof SIZES, number][]) {
      const resized = () => input.clone().resize({ width: maxW, withoutEnlargement: true });
      const path = `${publicDir}/${base}-${size}.${ext}`;
      const info = await encode(resized()).toFile(this.toDisk(path));
      const rendition: Rendition = { path, width: info.width, height: info.height };
      if (ext !== 'webp') {
        rendition.webp = `${publicDir}/${base}-${size}.webp`;
        await resized().webp({ quality: QUALITY }).toFile(this.toDisk(rendition.webp));
      }
      variants[size] = rendition;
    }

    return { width: original.width, height: original.height, variants };
  }

  /** Generates favicon PNGs for an image (idempotent). */
  async ensureIconRenditions(id: string) {
    const media = await this.findOne(id);
    const variants = media.variants as MediaVariants;
    if (variants.icon) return media;
    const base = media.path.replace(/\.[a-z0-9]+$/i, '');
    const icon: Record<string, string> = {};
    for (const size of ICON_SIZES) {
      const path = `${base}-icon-${size}.png`;
      await sharp(this.toDisk(media.path)).resize(size, size, { fit: 'cover' }).png().toFile(this.toDisk(path));
      icon[size] = path;
    }
    return this.prisma.media.update({
      where: { id },
      data: { variants: { ...variants, icon } as Prisma.InputJsonValue },
    });
  }

  /** Grabs a frame 1s in as a poster, if ffmpeg is installed. */
  private async extractPoster(videoFile: string, posterPublic: string) {
    if (this.ffmpegAvailable === undefined) {
      this.ffmpegAvailable = await run('ffmpeg', ['-version'])
        .then(() => true)
        .catch(() => false);
    }
    if (!this.ffmpegAvailable) return undefined;
    try {
      await run('ffmpeg', ['-y', '-ss', '1', '-i', videoFile, '-frames:v', '1', '-q:v', '3', this.toDisk(posterPublic)]);
      return posterPublic;
    } catch (error) {
      this.logger.warn(`Poster extraction failed: ${(error as Error).message}`);
      return undefined;
    }
  }

  async list(params: { kind?: MediaKind; q?: string; skip?: number; take?: number }) {
    const where: Prisma.MediaWhereInput = {
      ...(params.kind ? { kind: params.kind } : {}),
      ...(params.q
        ? {
            OR: [
              { filename: { contains: params.q, mode: 'insensitive' } },
              { alt: { contains: params.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const take = Math.min(params.take ?? 40, 100);
    const skip = params.skip ?? 0;
    const [items, total] = await Promise.all([
      this.prisma.media.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
      this.prisma.media.count({ where }),
    ]);
    return { items, total, skip, take };
  }

  async findOne(id: string) {
    const media = await this.prisma.media.findUnique({ where: { id } });
    if (!media) throw new NotFoundException('Media not found.');
    return media;
  }

  async update(actorId: string, id: string, data: { alt?: string; filename?: string }) {
    const before = await this.findOne(id);
    const media = await this.prisma.media.update({
      where: { id },
      data: { alt: data.alt?.trim(), filename: data.filename?.trim() },
    });
    await this.audit.log(actorId, 'UPDATE', 'Media', id, {
      alt: { from: before.alt, to: media.alt },
      filename: { from: before.filename, to: media.filename },
    });
    return media;
  }

  /** Lists every place a media item is used, so in-use files cannot be deleted. */
  async usages(id: string) {
    const [services, gallery, clients, team, settings] = await Promise.all([
      this.prisma.service.findMany({ where: { imageId: id }, select: { title: true } }),
      this.prisma.galleryPhoto.findMany({ where: { imageId: id }, select: { caption: true } }),
      this.prisma.client.findMany({ where: { logoId: id }, select: { name: true } }),
      this.prisma.teamMember.findMany({ where: { photoId: id }, select: { name: true } }),
      this.prisma.$queryRaw<{ key: string }[]>`
        SELECT key FROM site_settings WHERE value::text LIKE ${`%"${id}"%`}`,
    ]);
    return [
      ...services.map((s) => `Service: ${s.title}`),
      ...gallery.map((g) => `Gallery: ${g.caption}`),
      ...clients.map((c) => `Client: ${c.name}`),
      ...team.map((t) => `Team: ${t.name}`),
      ...settings.map((s) => `Site settings: ${s.key}`),
    ];
  }

  async remove(actorId: string, id: string) {
    const media = await this.findOne(id);
    const usedBy = await this.usages(id);
    if (usedBy.length) {
      throw new ConflictException({
        message: 'This file is in use and cannot be deleted. Replace it first.',
        usedBy,
      });
    }

    await this.prisma.media.delete({ where: { id } });

    const variants = media.variants as MediaVariants;
    const files = [
      media.path,
      variants.poster,
      ...Object.values(variants.icon ?? {}),
      ...Object.values(variants)
        .filter((v): v is Rendition => typeof v === 'object' && v !== null && 'path' in v)
        .flatMap((v) => [v.path, v.webp]),
    ].filter((p): p is string => !!p);
    await Promise.all(files.map((p) => fs.rm(this.toDisk(p), { force: true })));

    await this.audit.log(actorId, 'DELETE', 'Media', id, { filename: media.filename });
    return { success: true };
  }

  /** Asserts that referenced media ids exist (and, for images, have alt text). */
  async assertUsable(ids: (string | null | undefined)[], opts: { requireAlt?: boolean } = {}) {
    const wanted = [...new Set(ids.filter((id): id is string => !!id))];
    if (!wanted.length) return;
    const found = await this.prisma.media.findMany({
      where: { id: { in: wanted } },
      select: { id: true, kind: true, alt: true, filename: true },
    });
    const missing = wanted.filter((id) => !found.some((m) => m.id === id));
    if (missing.length) throw new BadRequestException('Selected media no longer exists.');
    if (opts.requireAlt !== false) {
      const noAlt = found.filter((m) => m.kind === MediaKind.IMAGE && !m.alt.trim());
      if (noAlt.length) {
        throw new BadRequestException(
          `Add a description (alt text) to "${noAlt[0].filename}" in the media library before using it.`,
        );
      }
    }
  }
}
