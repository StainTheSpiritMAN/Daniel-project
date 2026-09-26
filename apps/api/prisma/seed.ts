/**
 * Seeds the CMS from the original hard-coded site content
 * (apps/web/src/data/company.ts + apps/web/public media) so a fresh database
 * renders the site exactly as it looked before the CMS.
 *
 * Safe to re-run: it only creates what is missing and never overwrites
 * content that staff have edited.
 *
 *   npm run seed --workspace apps/api
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ContentStatus, Prisma, type Media } from '@prisma/client';
import { join, parse } from 'path';
import { AppModule } from '../src/app.module';
import { hashPassword } from '../src/auth/auth.service';
import { MediaService } from '../src/media/media.service';
import { PrismaService } from '../src/prisma/prisma.service';
import * as site from '../../web/src/data/company';
import { DEFAULT_MEDIA_ALT, defaultSettings } from '../../web/src/data/defaults';

const PUBLIC_DIR = join(__dirname, '../../web/public');
// The Nest logger is silenced below (only errors/warnings), so report via console.
const log = { log: (msg: string) => console.log(`[seed] ${msg}`), error: console.error };
const PUBLISHED = ContentStatus.PUBLISHED;

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  const prisma = app.get(PrismaService);
  const mediaService = app.get(MediaService);

  // ── First admin ──────────────────────────────────────────────────────────
  if ((await prisma.user.count()) === 0) {
    const email = process.env.SEED_ADMIN_EMAIL;
    const password = process.env.SEED_ADMIN_PASSWORD;
    if (!email || !password) {
      throw new Error('Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD to create the first admin.');
    }
    await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name: process.env.SEED_ADMIN_NAME || 'Site Administrator',
        role: 'ADMIN',
        passwordHash: await hashPassword(password),
      },
    });
    log.log(`Created admin ${email} — change this password after first login.`);
  }

  // ── Media import (keyed by original public path) ─────────────────────────
  const imported = new Map<string, Media>();
  async function media(publicPath: string, alt: string) {
    const cached = imported.get(publicPath);
    if (cached) return cached;
    const { name: filename, ext } = parse(publicPath);
    let row = await prisma.media.findFirst({ where: { filename, path: { endsWith: ext } } });
    if (!row) {
      row = await mediaService.ingest({
        sourcePath: join(PUBLIC_DIR, publicPath),
        originalName: publicPath.split('/').pop()!,
        alt,
      });
      log.log(`Imported ${publicPath}`);
    }
    imported.set(publicPath, row);
    return row;
  }

  // ── Collections (only seeded while empty) ────────────────────────────────
  async function seedCollection(name: string, count: () => Promise<number>, create: () => Promise<unknown>) {
    if ((await count()) > 0) return log.log(`${name}: already has content, skipped`);
    await create();
    log.log(`${name}: seeded`);
  }

  await seedCollection('Services', () => prisma.service.count(), async () => {
    for (const [sortOrder, s] of site.services.entries()) {
      const image = await media(s.image, s.imageAlt);
      await prisma.service.create({
        data: { slug: s.slug, title: s.title, summary: s.summary, items: [...s.items], imageId: image.id, status: PUBLISHED, sortOrder },
      });
    }
  });

  await seedCollection('Projects', () => prisma.project.count(), () =>
    prisma.project.createMany({
      data: site.projects.map((p, sortOrder) => ({ ...p, status: PUBLISHED, sortOrder })),
    }),
  );

  await seedCollection('Gallery', () => prisma.galleryPhoto.count(), async () => {
    for (const [sortOrder, g] of site.projectGallery.entries()) {
      const image = await media(g.src, g.alt);
      await prisma.galleryPhoto.create({
        data: { imageId: image.id, caption: g.caption, status: PUBLISHED, sortOrder },
      });
    }
  });

  await seedCollection('Clients', () => prisma.client.count(), async () => {
    // The brochure logos are not labelled; staff can rename them in the admin.
    for (const [sortOrder, src] of site.clientLogos.entries()) {
      const n = sortOrder + 1;
      const logo = await media(src, `Client logo ${n}`);
      await prisma.client.create({
        data: { name: `Client ${String(n).padStart(2, '0')}`, logoId: logo.id, status: PUBLISHED, sortOrder },
      });
    }
  });

  await seedCollection('Team', () => prisma.teamMember.count(), () =>
    prisma.teamMember.createMany({
      data: site.management.map((m, sortOrder) => ({ name: m.name, role: m.role, bio: m.bio, status: PUBLISHED, sortOrder })),
    }),
  );

  await seedCollection('Core values', () => prisma.coreValue.count(), () =>
    prisma.coreValue.createMany({
      data: site.coreValues.map((v, sortOrder) => ({ ...v, status: PUBLISHED, sortOrder })),
    }),
  );

  await seedCollection('Why us', () => prisma.whyPoint.count(), () =>
    prisma.whyPoint.createMany({
      data: site.whyChooseUs.map((w, sortOrder) => ({ ...w, status: PUBLISHED, sortOrder })),
    }),
  );

  // ── Site settings (only created if the key does not exist yet) ───────────
  // The defaults store bundled file paths in `*Id` fields; import each file
  // and swap the path for the new media id.
  async function withMediaIds(value: unknown): Promise<unknown> {
    if (Array.isArray(value)) return Promise.all(value.map(withMediaIds));
    if (!value || typeof value !== 'object') return value;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] =
        k.endsWith('Id') && typeof v === 'string' && v.startsWith('/')
          ? (await media(v, DEFAULT_MEDIA_ALT[v] ?? '')).id
          : await withMediaIds(v);
    }
    return out;
  }
  const settings = (await withMediaIds(defaultSettings)) as Record<string, object>;

  for (const [key, value] of Object.entries(settings)) {
    const created = await prisma.siteSetting.createMany({
      data: [{ key, value: value as Prisma.InputJsonObject }],
      skipDuplicates: true,
    });
    log.log(`Setting "${key}": ${created.count ? 'seeded' : 'already set, skipped'}`);
  }

  await app.close();
}

main().catch((error) => {
  log.error(error);
  process.exit(1);
});
