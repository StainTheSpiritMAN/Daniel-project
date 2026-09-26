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
  const heroVideo = await media('/video/lagos-skyline-hero.mp4', 'Aerial view of the Lagos skyline');
  const heroVideoWebm = await media('/video/lagos-skyline-hero.webm', 'Aerial view of the Lagos skyline');
  const heroPoster = await media('/video/lagos-skyline-hero-poster.jpg', 'Aerial view of the Lagos skyline');
  const teamImage = await media('/images/team/installation-team.jpg', 'Suburban installation team in front of a completed inverter bank');
  const aboutImage = await media('/images/projects/inverter-bank-installation.jpg', 'Inverter and battery bank installation delivered by our engineers');
  const servicesHeader = await media('/images/projects/rooftop-solar-array.jpg', 'Rooftop solar panel array on a commercial building');

  const settings: Record<string, object> = {
    company: {
      name: site.company.name,
      shortName: site.company.shortName,
      tagline: site.company.tagline,
      intro: site.company.intro,
      website: site.company.website,
      emails: [...site.company.emails],
      phones: [...site.company.phones],
      address: site.company.address,
    },
    hero: {
      badge: 'IT · Power · Energy · Consulting',
      headline: 'Smart, sustainable technology & energy solutions',
      highlight: 'technology & energy',
      subtext:
        'We deliver tailored, technology-driven, and energy-efficient solutions for homes, offices, institutions, and rural communities across Nigeria and beyond.',
      primaryCta: { label: 'Request a Quote', href: '/contact' },
      secondaryCta: { label: 'Our Services', href: '/services' },
      stats: [
        { value: '17+', label: 'Years of combined leadership experience' },
        { value: '4', label: 'Core solution areas' },
        { value: '16+', label: 'Delivered projects' },
        { value: '100%', label: 'Indigenous Nigerian company' },
      ],
      videoId: heroVideo.id,
      videoWebmId: heroVideoWebm.id,
      posterId: heroPoster.id,
    },
    home: {
      aboutHeading: { eyebrow: 'Who We Are', title: 'A fully indigenous, technology-driven company' },
      aboutParagraphs: [site.about.paragraphs[1], site.about.paragraphs[2]],
      servicesHeading: {
        eyebrow: 'What We Do',
        title: 'Our Services',
        subtitle: 'From smart automation to renewable energy and professional training, we cover the full lifecycle of modern infrastructure.',
      },
      whyHeading: { eyebrow: 'Why Choose Us', title: 'A partner you can rely on' },
      whyImageId: teamImage.id,
      whyImageCaption: 'Our installation team on a completed power project',
      clientsHeading: { eyebrow: 'Our Clients', title: 'Trusted by leading organizations' },
    },
    about: {
      metaDescription:
        'Learn about Suburban Integrated Services Limited — a fully indigenous, technology-driven company delivering IT, power, and renewable energy solutions.',
      header: {
        eyebrow: 'About Company',
        title: 'About Suburban Integrated Services',
        subtitle: 'Empowering individuals, businesses, and communities through technology, innovation, and sustainable infrastructure.',
      },
      paragraphs: [...site.about.paragraphs],
      imageId: aboutImage.id,
      consultancy: { ...site.about.consultancy },
      expertise: { ...site.about.expertise },
      ceoHeading: { eyebrow: 'CEO Statement', title: 'A message from our CEO' },
      valuesHeading: { eyebrow: 'Core Values', title: 'What drives us' },
      managementHeading: { eyebrow: 'Management', title: 'Meet our leadership' },
    },
    missionVision: { mission: site.mission, vision: site.vision },
    ceo: {
      name: site.ceo.name,
      title: site.ceo.title,
      thankYou: site.ceo.thankYou,
      statement: [...site.ceo.statement],
    },
    servicesPage: {
      metaDescription:
        'Smart home & building automation, power solutions & renewable energy, professional training, and IT & general consulting from Suburban Integrated Services.',
      header: {
        eyebrow: 'Our Services',
        title: 'Solutions tailored to your needs',
        subtitle: 'We deliver world-class services with a deep understanding of local challenges and global standards.',
      },
      headerImageId: servicesHeader.id,
    },
    projectsPage: {
      metaDescription:
        'A selection of projects delivered by Suburban Integrated Services Limited across power, security, ICT, and renewable energy.',
      header: {
        eyebrow: 'Our Projects & Clientele',
        title: 'Delivering results across Nigeria',
        subtitle: 'A snapshot of recent project highlights spanning power backup, security systems, ICT infrastructure, and renewable energy.',
      },
      galleryHeading: {
        eyebrow: 'From the Field',
        title: 'Our work in pictures',
        subtitle: 'Real installations and training engagements delivered by our team.',
      },
      clientsHeading: { eyebrow: 'Our Clients', title: 'Trusted by leading organizations' },
    },
    contactPage: {
      metaDescription:
        'Get in touch with Suburban Integrated Services Limited for smart automation, power, renewable energy, and consulting solutions.',
      header: {
        eyebrow: 'Contact Us',
        title: "Let's talk about your project",
        subtitle: 'Reach out and our team will get back to you shortly with tailored advice and a no-obligation quote.',
      },
      intro: {
        title: 'Get in touch',
        body: "We're here to help with smart automation, power, renewable energy, training, and consulting.",
      },
    },
    cta: {
      title: 'Ready to power your next project?',
      body: "Let's deploy smart, sustainable, and reliable solutions tailored to your needs — from homes and offices to rural communities.",
      primaryCta: { label: 'Get a Free Consultation', href: '/contact' },
      secondaryCta: { label: 'Explore Services', href: '/services' },
    },
    seo: {
      defaultTitle: `${site.company.name} — ${site.company.tagline}`,
      defaultDescription: site.company.intro,
      keywords: [
        'Suburban Integrated Services',
        'smart home automation Nigeria',
        'solar power solutions',
        'renewable energy',
        'CCTV installation',
        'IT consulting',
        'inverter installation',
        'Rivers State',
      ],
    },
  };

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
