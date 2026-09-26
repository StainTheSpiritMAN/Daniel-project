/** Shapes of CMS content as returned by the public API (no framework imports). */
import type { ThemeSetting } from './theme';

export type CmsMedia = {
  id: string;
  path: string;
  alt: string;
  width: number | null;
  height: number | null;
  mimeType: string;
  variants: {
    poster?: string;
    thumb?: { path: string; webp?: string };
    icon?: Record<string, string>;
  };
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
  theme: ThemeSetting;
  branding: { logoId?: string; logoDarkId?: string; iconId?: string };
};
