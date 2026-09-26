import { PRESETS } from '@/lib/theme';

/*
 * Form definitions for every editable piece of the site. Limits mirror the API
 * validators (apps/api/src/content/dto and apps/api/src/settings/dto) so editors
 * see problems before they save — keep the two in sync.
 */

type Base = { name: string; label: string; help?: string; required?: boolean };
/** Light formatting: "block" allows paragraphs and lists, "inline" only bold/italic/links. */
type Format = { format?: 'block' | 'inline' };

export type Field =
  | (Base & Format & { type: 'text'; max: number; placeholder?: string })
  | (Base & Format & { type: 'textarea'; max: number; rows?: number })
  | (Base & { type: 'slug'; max: number; from: string })
  | (Base & Format & { type: 'list'; max: number; maxItems: number; itemLabel: string; multiline?: boolean })
  | (Base & { type: 'media'; kind: 'IMAGE' | 'VIDEO'; hint?: string })
  | (Base & { type: 'group'; fields: Field[] })
  | (Base & { type: 'repeater'; maxItems: number; itemLabel: string; fields: Field[] })
  | (Base & { type: 'emails'; maxItems: number })
  | (Base & { type: 'select'; options: { value: string; label: string }[] })
  | (Base & { type: 'color' })
  | (Base & { type: 'range'; min: number; max: number; step: number; defaultValue: number; unit?: string });

const text = (name: string, label: string, max: number, extra: Partial<Base> & Format & { placeholder?: string } = {}): Field => ({
  type: 'text', name, label, max, required: true, ...extra,
});
const area = (name: string, label: string, max: number, extra: Partial<Base> & Format & { rows?: number } = {}): Field => ({
  type: 'textarea', name, label, max, required: true, ...extra,
});
const image = (name: string, label: string, extra: Partial<Base> & { hint?: string } = {}): Field => ({
  type: 'media', kind: 'IMAGE', name, label, ...extra,
});
const heading = (name: string, label: string): Field => ({
  type: 'group',
  name,
  label,
  fields: [
    text('eyebrow', 'Small label above the title', 40),
    text('title', 'Title', 120),
    area('subtitle', 'Subtitle', 300, { required: false, rows: 2 }),
  ],
});
const link = (name: string, label: string): Field => ({
  type: 'group',
  name,
  label,
  fields: [
    text('label', 'Button text', 40),
    text('href', 'Link', 200, { help: 'A page such as /contact, or a full web address.' }),
  ],
});
const titleBody = (name: string, label: string): Field => ({
  type: 'group',
  name,
  label,
  fields: [text('title', 'Title', 120), area('body', 'Text', 1500, { rows: 4, format: 'block' })],
});
/** Optional banner photo + darkness, shared by the inner-page settings. */
const bannerFields = (defaultDarkness = 75): Field[] => [
  image('headerImageId', 'Banner background photo', { hint: 'Optional. A wide landscape photo; it is darkened so the title stays readable.' }),
  {
    type: 'range', name: 'headerOverlay', label: 'Banner photo darkness', min: 0, max: 90, step: 5,
    defaultValue: defaultDarkness, unit: '%', help: 'Higher = darker photo and easier-to-read text.',
  },
];

const metaDescription = area('metaDescription', 'Search engine description', 300, {
  required: false,
  rows: 2,
  help: 'Shown by Google under the page title. About 150 characters works best.',
});

// ─── Collections ──────────────────────────────────────────────────────────────

export type CollectionConfig = {
  label: string;
  singular: string;
  description: string;
  fields: Field[];
  /** Relation holding the thumbnail shown in the list, if any. */
  thumb?: string;
  primary: (row: Record<string, unknown>) => string;
  secondary?: (row: Record<string, unknown>) => string;
};

export const COLLECTIONS: Record<string, CollectionConfig> = {
  services: {
    label: 'Services',
    singular: 'service',
    description: 'Service cards on the homepage, the Services page and the footer.',
    thumb: 'image',
    primary: (r) => String(r.title),
    secondary: (r) => String(r.summary),
    fields: [
      text('title', 'Title', 80),
      {
        type: 'slug', name: 'slug', label: 'Web address', max: 80, from: 'title', required: true,
        help: 'Used for links like /services#smart-home. Lowercase letters, numbers and dashes.',
      },
      area('summary', 'Summary', 400, { rows: 3, format: 'block' }),
      { type: 'list', name: 'items', label: 'Bullet points', itemLabel: 'point', max: 160, maxItems: 12, required: true, format: 'inline' },
      image('imageId', 'Photo', { hint: 'Landscape, at least 1600px wide (16:9).' }),
    ],
  },
  projects: {
    label: 'Projects',
    singular: 'project',
    description: 'Project cards on the Projects page.',
    primary: (r) => String(r.title),
    secondary: (r) => `${r.client} · ${r.year}`,
    fields: [
      text('title', 'Project title', 200),
      text('client', 'Client', 120, { help: 'Use a general description (e.g. "Private sector client") if the client may not be named.' }),
      text('year', 'Year', 20, { placeholder: '2025 or 2024/25' }),
      area('description', 'Short description', 1000, { required: false, rows: 3, format: 'block' }),
    ],
  },
  gallery: {
    label: 'Gallery',
    singular: 'photo',
    description: '"Our work in pictures" on the Projects page.',
    thumb: 'image',
    primary: (r) => String(r.caption),
    fields: [
      image('imageId', 'Photo', { required: true, hint: 'Landscape works best (4:3).' }),
      text('caption', 'Caption', 140),
    ],
  },
  clients: {
    label: 'Clients',
    singular: 'client',
    description: 'Client logo strip on the homepage and Projects page.',
    thumb: 'logo',
    primary: (r) => String(r.name),
    secondary: (r) => (r.websiteUrl ? String(r.websiteUrl) : ''),
    fields: [
      text('name', 'Client name', 120),
      image('logoId', 'Logo', { hint: 'Logo on a white or transparent background.' }),
      { type: 'text', name: 'websiteUrl', label: 'Website (optional)', max: 300, placeholder: 'https://', help: 'If set, the logo links to this site.' },
    ],
  },
  team: {
    label: 'Team',
    singular: 'team member',
    description: '"Meet our leadership" on the About page.',
    thumb: 'photo',
    primary: (r) => String(r.name),
    secondary: (r) => String(r.role),
    fields: [
      text('name', 'Name', 120),
      text('role', 'Role / job title', 160),
      { type: 'list', name: 'bio', label: 'Biography', itemLabel: 'paragraph', max: 2000, maxItems: 8, multiline: true, required: true, format: 'block' },
      image('photoId', 'Photo', { hint: 'Square head-and-shoulders photo. Initials are shown if empty.' }),
    ],
  },
  values: {
    label: 'Core values',
    singular: 'core value',
    description: 'Core values on the About page; the first four also appear on the homepage.',
    primary: (r) => String(r.title),
    secondary: (r) => String(r.description),
    fields: [text('title', 'Value', 60), area('description', 'Description', 240, { rows: 2, format: 'inline' })],
  },
  'why-us': {
    label: 'Why choose us',
    singular: 'reason',
    description: '"Why choose us" points on the homepage.',
    primary: (r) => String(r.title),
    secondary: (r) => String(r.description),
    fields: [text('title', 'Title', 60), area('description', 'Description', 240, { rows: 2, format: 'inline' })],
  },
};

// ─── Site settings ────────────────────────────────────────────────────────────

export type SettingConfig = {
  label: string;
  description: string;
  group: string;
  adminOnly?: boolean;
  fields: Field[];
  /** Settings with their own editor instead of a field form. */
  custom?: 'layout';
};

export const SETTINGS: Record<string, SettingConfig> = {
  company: {
    label: 'Company details',
    group: 'General',
    description: 'Name, contact details and address used in the header, footer and Contact page.',
    fields: [
      text('name', 'Company name', 120),
      text('shortName', 'Short name', 80, { help: 'Used in browser tab titles.' }),
      text('tagline', 'Tagline', 80, { help: 'Shown under the logo.' }),
      area('intro', 'Short introduction', 400, { rows: 3, help: 'Shown in the footer.', format: 'inline' }),
      text('website', 'Website address', 120),
      { type: 'emails', name: 'emails', label: 'Email addresses', maxItems: 4, required: true, help: 'The first one is shown in the footer.' },
      { type: 'list', name: 'phones', label: 'Phone numbers', itemLabel: 'phone number', max: 30, maxItems: 4, required: true },
      area('address', 'Address', 300, { rows: 2 }),
      { type: 'text', name: 'mapUrl', label: 'Google Maps link (optional)', max: 500, placeholder: 'https://maps.google.com/…' },
    ],
  },
  hero: {
    label: 'Homepage hero',
    group: 'Homepage',
    description: 'The big banner at the top of the homepage, including the background video.',
    fields: [
      text('badge', 'Small badge text', 60),
      text('headline', 'Headline', 90),
      {
        type: 'text', name: 'highlight', label: 'Words to highlight in gold', max: 60,
        help: 'Must match part of the headline exactly, e.g. "technology & energy".',
      },
      area('subtext', 'Text under the headline', 300, { rows: 3, format: 'inline' }),
      link('primaryCta', 'Main button'),
      link('secondaryCta', 'Second button'),
      {
        type: 'repeater', name: 'stats', label: 'Highlight numbers', itemLabel: 'number', maxItems: 4,
        fields: [text('value', 'Number', 12, { placeholder: '16+' }), text('label', 'Label', 80)],
      },
      {
        type: 'media', kind: 'VIDEO', name: 'videoId', label: 'Background video (MP4)',
        hint: '1080p, 15–30 seconds, no sound, under 10 MB. See the editor guide for how to compress.',
      },
      { type: 'media', kind: 'VIDEO', name: 'videoWebmId', label: 'Background video (WebM, optional)', hint: 'Smaller alternative version of the same clip.' },
      image('posterId', 'Video placeholder image', { hint: 'Shown while the video loads. Uses a frame from the video if empty.' }),
      {
        type: 'range', name: 'overlay', label: 'Video darkness', min: 0, max: 90, step: 5, defaultValue: 60, unit: '%',
        help: 'How much the video is darkened behind the headline. Higher = easier to read.',
      },
    ],
  },
  home: {
    label: 'Homepage sections',
    group: 'Homepage',
    description: 'Headings and text for the sections below the hero.',
    fields: [
      heading('aboutHeading', '"Who we are" heading'),
      { type: 'list', name: 'aboutParagraphs', label: '"Who we are" text', itemLabel: 'paragraph', max: 1200, maxItems: 4, multiline: true, required: true, format: 'block' },
      heading('servicesHeading', 'Services heading'),
      heading('whyHeading', '"Why choose us" heading'),
      image('whyImageId', '"Why choose us" photo'),
      { type: 'text', name: 'whyImageCaption', label: 'Photo caption', max: 140 },
      heading('clientsHeading', 'Clients heading'),
    ],
  },
  missionVision: {
    label: 'Mission & vision',
    group: 'Homepage',
    description: 'Shown on the homepage and the About page.',
    fields: [
      area('mission', 'Mission', 600, { rows: 4, format: 'block' }),
      area('vision', 'Vision', 600, { rows: 4, format: 'block' }),
    ],
  },
  about: {
    label: 'About page',
    group: 'Pages',
    description: 'Company overview, consultancy and expertise text, and section headings.',
    fields: [
      metaDescription,
      heading('header', 'Page banner'),
      ...bannerFields(),
      { type: 'list', name: 'paragraphs', label: 'Company overview', itemLabel: 'paragraph', max: 1200, maxItems: 8, multiline: true, required: true, format: 'block' },
      image('imageId', 'Overview photo'),
      titleBody('consultancy', 'Consultancy block'),
      titleBody('expertise', 'Expertise block'),
      heading('ceoHeading', 'CEO statement heading'),
      heading('valuesHeading', 'Core values heading'),
      heading('managementHeading', 'Management heading'),
    ],
  },
  ceo: {
    label: 'CEO statement',
    group: 'Pages',
    description: 'The CEO card and message on the About page.',
    fields: [
      text('name', 'Name', 120),
      text('title', 'Title', 160),
      area('thankYou', 'Quote on the card', 200, { rows: 2, format: 'inline' }),
      { type: 'list', name: 'statement', label: 'Statement', itemLabel: 'paragraph', max: 1500, maxItems: 8, multiline: true, required: true, format: 'block' },
      image('photoId', 'Photo', { hint: 'Square photo. Initials are shown if empty.' }),
    ],
  },
  servicesPage: {
    label: 'Services page',
    group: 'Pages',
    description: 'Banner at the top of the Services page. The services themselves are under Content → Services.',
    fields: [metaDescription, heading('header', 'Page banner'), ...bannerFields()],
  },
  projectsPage: {
    label: 'Projects page',
    group: 'Pages',
    description: 'Banner and section headings on the Projects page.',
    fields: [
      metaDescription,
      heading('header', 'Page banner'),
      ...bannerFields(),
      heading('galleryHeading', 'Gallery heading'),
      heading('clientsHeading', 'Clients heading'),
    ],
  },
  contactPage: {
    label: 'Contact page',
    group: 'Pages',
    description: 'Banner and introduction on the Contact page. Phone and email are under Company details.',
    fields: [metaDescription, heading('header', 'Page banner'), ...bannerFields(), titleBody('intro', 'Introduction')],
  },
  cta: {
    label: 'Call-to-action banner',
    group: 'General',
    description: 'The dark "Ready to power your next project?" banner near the bottom of most pages.',
    fields: [
      text('title', 'Title', 120),
      area('body', 'Text', 400, { rows: 3, format: 'block' }),
      link('primaryCta', 'Main button'),
      link('secondaryCta', 'Second button'),
    ],
  },
  theme: {
    label: 'Colours & theme',
    group: 'Appearance',
    adminOnly: true,
    description: 'The colour scheme of the whole website. Pick a ready-made theme or set your own brand colour.',
    fields: [
      {
        type: 'select',
        name: 'preset',
        label: 'Theme',
        required: true,
        options: [
          ...Object.entries(PRESETS).map(([value, p]) => ({ value, label: p.label })),
          { value: 'custom', label: 'Custom colours' },
        ],
      },
      { type: 'color', name: 'brand', label: 'Brand colour', help: 'Buttons, highlights and accents. Used when the theme is "Custom colours".' },
      { type: 'color', name: 'dark', label: 'Dark colour', help: 'Dark sections, footer and headings. Pick a very dark shade.' },
    ],
  },
  branding: {
    label: 'Logo & site icon',
    group: 'Appearance',
    adminOnly: true,
    description: 'Replace the "S SUBURBAN" lettermark with your logo, and set the icon shown in browser tabs and phone home screens.',
    fields: [
      image('logoId', 'Logo (for light backgrounds)', {
        hint: 'Used in the header. A wide PNG with a transparent background, at least 400 px wide. Leave empty to keep the lettermark.',
      }),
      image('logoDarkId', 'Logo for dark backgrounds (optional)', {
        hint: 'Used in the footer. A white/light version of the logo. Falls back to the main logo.',
      }),
      image('iconId', 'Site icon', { hint: 'A square image, ideally 512 × 512 px PNG. Browser-tab and home-screen sizes are made automatically.' }),
    ],
  },
  layout: {
    label: 'Page layout & backgrounds',
    group: 'Appearance',
    adminOnly: true,
    custom: 'layout',
    description: 'Show, hide and reorder the sections of each page, and choose section backgrounds, image sides and columns.',
    fields: [],
  },
  seo: {
    label: 'Search & sharing (SEO)',
    group: 'General',
    adminOnly: true,
    description: 'Default page title, description and share image for Google and social media.',
    fields: [
      text('defaultTitle', 'Default page title', 90),
      area('defaultDescription', 'Default description', 300, { rows: 3 }),
      { type: 'list', name: 'keywords', label: 'Keywords', itemLabel: 'keyword', max: 60, maxItems: 25, required: true },
      image('ogImageId', 'Share image', { hint: '1200 × 630 px. Shown when the site is shared on WhatsApp, Facebook, LinkedIn…' }),
    ],
  },
};

/** Empty value for a set of fields, used when creating new content. */
export function emptyValue(fields: Field[]): Record<string, unknown> {
  return Object.fromEntries(
    fields.map((f) => {
      switch (f.type) {
        case 'group':
          return [f.name, emptyValue(f.fields)];
        case 'list':
        case 'emails':
        case 'repeater':
          return [f.name, []];
        case 'media':
          return [f.name, null];
        case 'select':
          return [f.name, f.options[0]?.value ?? ''];
        case 'range':
          return [f.name, f.defaultValue];
        default:
          return [f.name, ''];
      }
    }),
  );
}

/** Client-side checks mirroring the API; returns `{ 'path.to.field': message }`. */
export function validate(fields: Field[], value: Record<string, unknown>, prefix = ''): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const f of fields) {
    const path = prefix + f.name;
    const v = value?.[f.name];
    switch (f.type) {
      case 'text':
      case 'textarea':
      case 'slug': {
        const s = typeof v === 'string' ? v.trim() : '';
        if (f.required && !s) errors[path] = 'Required';
        else if (s.length > f.max) errors[path] = `Keep this under ${f.max} characters`;
        else if (f.type === 'slug' && s && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)) {
          errors[path] = 'Only lowercase letters, numbers and single dashes';
        }
        break;
      }
      case 'list':
      case 'emails': {
        const items = (Array.isArray(v) ? v : []) as string[];
        if (f.required && items.length === 0) errors[path] = 'Add at least one';
        else if (items.length > f.maxItems) errors[path] = `No more than ${f.maxItems}`;
        items.forEach((item, i) => {
          if (!item.trim()) errors[`${path}.${i}`] = 'Empty — fill in or remove';
          else if (f.type === 'list' && item.length > f.max) errors[`${path}.${i}`] = `Keep this under ${f.max} characters`;
          else if (f.type === 'emails' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(item)) errors[`${path}.${i}`] = 'Not a valid email';
        });
        break;
      }
      case 'media':
        if (f.required && !v) errors[path] = 'Choose a file';
        break;
      case 'select':
        if (!f.options.some((o) => o.value === v)) errors[path] = 'Choose an option';
        break;
      case 'color':
        if (v && !/^#[0-9a-f]{6}$/i.test(String(v))) errors[path] = 'Use a colour like #E0A500';
        break;
      case 'range':
        if (typeof v !== 'number' || v < f.min || v > f.max) errors[path] = `Between ${f.min} and ${f.max}`;
        break;
      case 'group':
        Object.assign(errors, validate(f.fields, (v ?? {}) as Record<string, unknown>, `${path}.`));
        break;
      case 'repeater': {
        const rows = (Array.isArray(v) ? v : []) as Record<string, unknown>[];
        if (rows.length > f.maxItems) errors[path] = `No more than ${f.maxItems}`;
        rows.forEach((row, i) => Object.assign(errors, validate(f.fields, row, `${path}.${i}.`)));
        break;
      }
    }
  }
  return errors;
}

/**
 * Shapes form state for the API: trims text and drops empty optional values
 * (the API treats a missing optional field as "not set").
 */
export function toPayload(fields: Field[], value: Record<string, unknown>, forCollection = false) {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    const v = value?.[f.name];
    switch (f.type) {
      case 'text':
      case 'textarea':
      case 'slug': {
        const s = typeof v === 'string' ? v.trim() : '';
        if (s || f.required) out[f.name] = s;
        else if (forCollection) out[f.name] = null;
        break;
      }
      case 'list':
      case 'emails':
        out[f.name] = ((v as string[]) ?? []).map((s) => s.trim());
        break;
      case 'media':
        if (v) out[f.name] = v;
        else if (forCollection) out[f.name] = null;
        break;
      case 'select':
        out[f.name] = v;
        break;
      case 'color':
        if (v) out[f.name] = String(v).toUpperCase();
        break;
      case 'range':
        out[f.name] = Number(v);
        break;
      case 'group':
        out[f.name] = toPayload(f.fields, (v ?? {}) as Record<string, unknown>);
        break;
      case 'repeater':
        out[f.name] = ((v as Record<string, unknown>[]) ?? []).map((row) => toPayload(f.fields, row));
        break;
    }
  }
  return out;
}
