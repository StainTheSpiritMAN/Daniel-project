import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MediaKind, type Prisma, type Role } from '@prisma/client';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { validate, type ValidationError } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService, diffFields } from '../audit/audit.service';
import { RevalidateService } from '../common/revalidate.service';
import { MediaService } from '../media/media.service';
import { publicMediaSelect } from '../content/collections';
import { LAYOUT_SECTIONS, SETTINGS } from './dto/settings.dto';

/** Every string stored under a key ending in `Id` is a Media id. */
function collectMediaIds(value: unknown, out = new Set<string>()): Set<string> {
  if (Array.isArray(value)) value.forEach((v) => collectMediaIds(v, out));
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if (k.endsWith('Id') && typeof v === 'string' && v) out.add(v);
      else collectMediaIds(v, out);
    }
  }
  return out;
}

/** Media references with the kind each field expects (`video…Id` → video, else image). */
function collectMediaRefs(value: unknown, out: { id: string; kind: MediaKind }[] = []) {
  if (Array.isArray(value)) value.forEach((v) => collectMediaRefs(v, out));
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if (k.endsWith('Id') && typeof v === 'string' && v) {
        out.push({ id: v, kind: /^video/i.test(k) ? MediaKind.VIDEO : MediaKind.IMAGE });
      } else collectMediaRefs(v, out);
    }
  }
  return out;
}

function flattenErrors(errors: ValidationError[], prefix = ''): string[] {
  return errors.flatMap((e) => {
    const path = prefix ? `${prefix}.${e.property}` : e.property;
    return [
      ...Object.values(e.constraints ?? {}).map((msg) => msg.replace(e.property, path)),
      ...flattenErrors(e.children ?? [], path),
    ];
  });
}

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly revalidator: RevalidateService,
    private readonly media: MediaService,
  ) {}

  private assertKey(key: string) {
    const def = SETTINGS[key];
    if (!def) throw new NotFoundException(`Unknown setting "${key}".`);
    return def;
  }

  /** All settings plus the media they reference, for the public site. */
  async getAllPublic() {
    const rows = await this.prisma.siteSetting.findMany();
    const values = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return { values, media: await this.resolveMedia(values) };
  }

  async getPublic(key: string) {
    this.assertKey(key);
    const row = await this.prisma.siteSetting.findUnique({ where: { key } });
    const value = row?.value ?? null;
    return { key, value, media: await this.resolveMedia(value) };
  }

  async list() {
    const rows = await this.prisma.siteSetting.findMany({
      select: { key: true, updatedAt: true },
    });
    return Object.keys(SETTINGS).map((key) => ({
      key,
      adminOnly: !!SETTINGS[key].adminOnly,
      updatedAt: rows.find((r) => r.key === key)?.updatedAt ?? null,
    }));
  }

  async put(key: string, body: unknown, actor: { id: string; role: Role }) {
    const def = this.assertKey(key);
    if (def.adminOnly && actor.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can change these settings.');
    }

    const instance = plainToInstance(def.dto, body ?? {});
    const errors = await validate(instance, { whitelist: true, forbidNonWhitelisted: true });
    if (errors.length) throw new BadRequestException(flattenErrors(errors));

    const value = instanceToPlain(instance) as Prisma.InputJsonObject;
    await this.media.assertUsable(collectMediaRefs(value));
    if (key === 'theme' && value.preset === 'custom' && (!value.brand || !value.dark)) {
      throw new BadRequestException('A custom theme needs both a brand colour and a dark colour.');
    }
    if (key === 'branding') await this.prepareBranding(value);
    if (key === 'layout') this.checkLayout(value);

    const before = await this.prisma.siteSetting.findUnique({ where: { key } });
    const row = await this.prisma.siteSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
    await this.audit.log(
      actor.id,
      'UPDATE',
      'SiteSetting',
      key,
      diffFields(before?.value as Record<string, unknown> | null, value),
    );
    this.revalidator.revalidate('settings');
    return { key, value: row.value, media: await this.resolveMedia(row.value) };
  }

  /** Each page may only list its own sections, once each. */
  private checkLayout(value: Prisma.InputJsonObject) {
    for (const [page, sections] of Object.entries(value)) {
      if (sections === null || sections === undefined) continue;
      const allowed = LAYOUT_SECTIONS[page];
      if (!Array.isArray(sections)) throw new BadRequestException(`Invalid sections for the ${page} page.`);
      const keys = (sections as { key: string }[]).map((s) => s.key);
      if (!allowed || keys.some((k) => !allowed.includes(k)) || new Set(keys).size !== keys.length) {
        throw new BadRequestException(`Invalid sections for the ${page} page.`);
      }
    }
  }

  /** Logos must be images; the icon must be a square image, rendered to favicon sizes. */
  private async prepareBranding(value: Prisma.InputJsonObject) {
    for (const field of ['logoId', 'logoDarkId', 'iconId'] as const) {
      const id = value[field];
      if (typeof id !== 'string') continue;
      const media = await this.media.findOne(id);
      if (media.kind !== 'IMAGE') throw new BadRequestException('Logos and icons must be images (PNG with a transparent background works best).');
      if (field === 'iconId') {
        const { width, height } = media;
        if (!width || !height || Math.abs(width - height) / Math.max(width, height) > 0.05 || width < 180) {
          throw new BadRequestException('The site icon must be a square image at least 180 × 180 pixels (512 × 512 is ideal).');
        }
        await this.media.ensureIconRenditions(id);
      }
    }
  }

  private async resolveMedia(value: unknown) {
    const ids = [...collectMediaIds(value)];
    if (!ids.length) return {};
    const items = await this.prisma.media.findMany({
      where: { id: { in: ids } },
      select: publicMediaSelect,
    });
    return Object.fromEntries(items.map((m) => [m.id, m]));
  }
}
