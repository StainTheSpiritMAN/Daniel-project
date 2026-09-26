/**
 * The original site content in CMS shape. Used in two places:
 *  - the website falls back to it when the CMS API is unreachable or has not
 *    been seeded yet, so pages are never blank;
 *  - the API seed (apps/api/prisma/seed.ts) imports it to fill a new database.
 *
 * Media fields hold public file paths (under apps/web/public) instead of media
 * ids; the seed swaps them for real ids when it imports the files.
 *
 * Keep this file free of `@/` imports: the seed loads it outside Next.js.
 */
import type {
  Client,
  CmsMedia,
  GalleryPhoto,
  Project,
  Service,
  Settings,
  TeamMember,
  TitleDescription,
} from '../lib/cms-types';
import * as site from './company';

const HERO_ALT = 'Aerial view of the Lagos skyline';

/** Alt text for every bundled file referenced by the defaults. */
export const DEFAULT_MEDIA_ALT: Record<string, string> = {
  '/video/lagos-skyline-hero.mp4': HERO_ALT,
  '/video/lagos-skyline-hero.webm': HERO_ALT,
  '/video/lagos-skyline-hero-poster.jpg': HERO_ALT,
  '/images/team/installation-team.jpg': 'Suburban installation team in front of a completed inverter bank',
  '/images/projects/inverter-bank-installation.jpg': 'Inverter and battery bank installation delivered by our engineers',
  '/images/projects/rooftop-solar-array.jpg': 'Rooftop solar panel array on a commercial building',
  ...Object.fromEntries(site.services.map((s) => [s.image, s.imageAlt])),
  ...Object.fromEntries(site.projectGallery.map((g) => [g.src, g.alt])),
  ...Object.fromEntries(site.clientLogos.map((src, i) => [src, `Client logo ${i + 1}`])),
};

const MIME: Record<string, string> = { mp4: 'video/mp4', webm: 'video/webm', jpg: 'image/jpeg', png: 'image/png' };

/** Media-like object for a bundled public file. */
export function bundledMedia(path: string): CmsMedia {
  const ext = path.split('.').pop() ?? '';
  return {
    id: path,
    path,
    alt: DEFAULT_MEDIA_ALT[path] ?? '',
    width: null,
    height: null,
    mimeType: MIME[ext] ?? 'application/octet-stream',
    variants: {},
  };
}

export const defaultSettings: Settings = {
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
    videoId: '/video/lagos-skyline-hero.mp4',
    videoWebmId: '/video/lagos-skyline-hero.webm',
    posterId: '/video/lagos-skyline-hero-poster.jpg',
  },
  home: {
    aboutHeading: { eyebrow: 'Who We Are', title: 'A fully indigenous, technology-driven company' },
    aboutParagraphs: [site.about.paragraphs[1], site.about.paragraphs[2]],
    servicesHeading: {
      eyebrow: 'What We Do',
      title: 'Our Services',
      subtitle:
        'From smart automation to renewable energy and professional training, we cover the full lifecycle of modern infrastructure.',
    },
    whyHeading: { eyebrow: 'Why Choose Us', title: 'A partner you can rely on' },
    whyImageId: '/images/team/installation-team.jpg',
    whyImageCaption: 'Our installation team on a completed power project',
    clientsHeading: { eyebrow: 'Our Clients', title: 'Trusted by leading organizations' },
  },
  about: {
    metaDescription:
      'Learn about Suburban Integrated Services Limited — a fully indigenous, technology-driven company delivering IT, power, and renewable energy solutions.',
    header: {
      eyebrow: 'About Company',
      title: 'About Suburban Integrated Services',
      subtitle:
        'Empowering individuals, businesses, and communities through technology, innovation, and sustainable infrastructure.',
    },
    paragraphs: [...site.about.paragraphs],
    imageId: '/images/projects/inverter-bank-installation.jpg',
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
    headerImageId: '/images/projects/rooftop-solar-array.jpg',
  },
  projectsPage: {
    metaDescription:
      'A selection of projects delivered by Suburban Integrated Services Limited across power, security, ICT, and renewable energy.',
    header: {
      eyebrow: 'Our Projects & Clientele',
      title: 'Delivering results across Nigeria',
      subtitle:
        'A snapshot of recent project highlights spanning power backup, security systems, ICT infrastructure, and renewable energy.',
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

const id = (prefix: string, i: number) => `default-${prefix}-${i}`;

export const defaultCollections = {
  services: site.services.map<Service>((s, i) => ({
    id: id('service', i),
    slug: s.slug,
    title: s.title,
    summary: s.summary,
    items: [...s.items],
    image: bundledMedia(s.image),
  })),
  projects: site.projects.map<Project>((p, i) => ({ id: id('project', i), ...p, description: null })),
  gallery: site.projectGallery.map<GalleryPhoto>((g, i) => ({
    id: id('gallery', i),
    caption: g.caption,
    image: bundledMedia(g.src),
  })),
  clients: site.clientLogos.map<Client>((src, i) => ({
    id: id('client', i),
    name: `Client ${String(i + 1).padStart(2, '0')}`,
    websiteUrl: null,
    logo: bundledMedia(src),
  })),
  team: site.management.map<TeamMember>((m, i) => ({
    id: id('team', i),
    name: m.name,
    role: m.role,
    bio: [...m.bio],
    photo: null,
  })),
  values: site.coreValues.map<TitleDescription>((v, i) => ({ id: id('value', i), ...v })),
  whyUs: site.whyChooseUs.map<TitleDescription>((w, i) => ({ id: id('why', i), ...w })),
};
