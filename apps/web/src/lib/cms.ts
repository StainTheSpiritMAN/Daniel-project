import 'server-only';
import { siteConfig } from './config';

/*
 * Typed fetchers for CMS content. Responses are cached and tagged so the API
 * can refresh them on publish (see app/api/revalidate); `revalidate` is the
 * safety net if a refresh ping is ever missed.
 */

const API_URL = process.env.API_INTERNAL_URL || siteConfig.apiUrl;
const REVALIDATE_SECONDS = 300;

export type CmsMedia = {
  id: string;
  path: string;
  alt: string;
  width: number | null;
  height: number | null;
  mimeType: string;
  variants: { poster?: string };
};

type Status = { id: string };

export type Service = Status & {
  slug: string;
  title: string;
  summary: string;
  items: string[];
  image: CmsMedia | null;
};
export type Project = Status & { title: string; client: string; year: string; description: string | null };
export type GalleryPhoto = Status & { caption: string; image: CmsMedia };
export type Client = Status & { name: string; websiteUrl: string | null; logo: CmsMedia | null };
export type TeamMember = Status & { name: string; role: string; bio: string[]; photo: CmsMedia | null };
export type TitleDescription = Status & { title: string; description: string };

type Heading = { eyebrow: string; title: string; subtitle?: string };
type Link = { label: string; href: string };
type TitleBody = { title: string; body: string };

export type Settings = {
  company: {
    name: string;
    shortName: string;
    tagline: string;
    intro: string;
    website: string;
    emails: string[];
    phones: string[];
    address: string;
    mapUrl?: string;
  };
  hero: {
    badge: string;
    headline: string;
    highlight?: string;
    subtext: string;
    primaryCta: Link;
    secondaryCta: Link;
    stats: { value: string; label: string }[];
    videoId?: string;
    videoWebmId?: string;
    posterId?: string;
  };
  home: {
    aboutHeading: Heading;
    aboutParagraphs: string[];
    servicesHeading: Heading;
    whyHeading: Heading;
    whyImageId?: string;
    whyImageCaption?: string;
    clientsHeading: Heading;
  };
  about: {
    metaDescription?: string;
    header: Heading;
    paragraphs: string[];
    imageId?: string;
    consultancy: TitleBody;
    expertise: TitleBody;
    ceoHeading: Heading;
    valuesHeading: Heading;
    managementHeading: Heading;
  };
  missionVision: { mission: string; vision: string };
  ceo: { name: string; title: string; thankYou: string; statement: string[]; photoId?: string };
  servicesPage: { metaDescription?: string; header: Heading; headerImageId?: string };
  projectsPage: { metaDescription?: string; header: Heading; galleryHeading: Heading; clientsHeading: Heading };
  contactPage: { metaDescription?: string; header: Heading; intro: TitleBody };
  cta: { title: string; body: string; primaryCta: Link; secondaryCta: Link };
  seo: { defaultTitle: string; defaultDescription: string; keywords: string[]; ogImageId?: string };
};

async function cmsFetch<T>(path: string, tag: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      next: { tags: [tag], revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } catch (error) {
    // Builds (e.g. CI) may run without the API: render empty sections and let
    // the timed revalidation fill them in. At runtime, throw so Next keeps
    // serving the last good page instead of caching an empty one.
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      console.warn(`[cms] ${path} unavailable during build: ${(error as Error).message}`);
      return fallback;
    }
    throw error;
  }
}

export const getServices = () => cmsFetch<Service[]>('/services', 'services', []);
export const getProjects = () => cmsFetch<Project[]>('/projects', 'projects', []);
export const getGallery = () => cmsFetch<GalleryPhoto[]>('/gallery', 'gallery', []);
export const getClients = () => cmsFetch<Client[]>('/clients', 'clients', []);
export const getTeam = () => cmsFetch<TeamMember[]>('/team', 'team', []);
export const getCoreValues = () => cmsFetch<TitleDescription[]>('/values', 'values', []);
export const getWhyUs = () => cmsFetch<TitleDescription[]>('/why-us', 'why-us', []);

export type SiteSettings = {
  values: Partial<Settings>;
  media: Record<string, CmsMedia>;
};

export async function getSettings() {
  const data = await cmsFetch<SiteSettings>('/settings', 'settings', { values: {}, media: {} });
  return {
    ...data.values,
    /** Resolves a media id stored in a setting. */
    media: (id?: string) => (id ? data.media[id] : undefined),
  };
}
