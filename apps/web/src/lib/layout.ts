/**
 * Page layouts editable in the CMS: which sections a page shows, in what order,
 * and a few safe per-section options. The defaults reproduce the original
 * design. Pure data + helpers, shared by the site and the admin editor.
 * Keep section keys in sync with apps/api/src/settings/dto/settings.dto.ts.
 */

export type Background = 'white' | 'tint' | 'dark' | 'brand';
export type ImagePosition = 'left' | 'right' | 'alternate';
export type Columns = 2 | 3 | 4;

export type SectionConfig = {
  key: string;
  visible: boolean;
  background?: Background;
  imagePosition?: ImagePosition;
  columns?: Columns;
  /** Optional photo behind the section (media id) and its visibility, 5–100%. */
  backgroundImageId?: string;
  backgroundOpacity?: number;
};

/** Photo visibility used when a background photo is first chosen. */
export const DEFAULT_PHOTO_OPACITY = 25;

type SectionDef = {
  label: string;
  /** Whether the section's background can be changed. */
  background?: Background;
  imagePosition?: { default: ImagePosition; options: ImagePosition[] };
  columns?: { default: Columns; options: Columns[] };
};

export type LayoutPage = 'home' | 'about' | 'services' | 'projects';
export type LayoutSetting = Partial<Record<LayoutPage, SectionConfig[]>>;

export const BACKGROUNDS: { value: Background; label: string }[] = [
  { value: 'white', label: 'White' },
  { value: 'tint', label: 'Light grey' },
  { value: 'dark', label: 'Dark' },
  { value: 'brand', label: 'Brand colour' },
];

export const LAYOUT_PAGES: Record<
  LayoutPage,
  { label: string; sections: Record<string, SectionDef> }
> = {
  home: {
    label: 'Homepage',
    sections: {
      hero: { label: 'Hero banner (video)' },
      about: { label: 'Who we are', background: 'white' },
      services: {
        label: 'Services',
        background: 'tint',
        columns: { default: 4, options: [2, 3, 4] },
      },
      missionVision: { label: 'Mission & vision', background: 'white' },
      whyUs: {
        label: 'Why choose us',
        background: 'tint',
        imagePosition: { default: 'left', options: ['left', 'right'] },
      },
      news: { label: 'News & activities slider', background: 'white' },
      clients: { label: 'Client logos', background: 'white' },
      cta: { label: 'Call-to-action banner', background: 'white' },
    },
  },
  about: {
    label: 'About page',
    sections: {
      overview: {
        label: 'Company overview',
        background: 'white',
        imagePosition: { default: 'right', options: ['left', 'right'] },
      },
      expertise: { label: 'Consultancy & expertise', background: 'tint' },
      ceo: { label: 'CEO statement', background: 'white' },
      missionVision: { label: 'Mission & vision', background: 'tint' },
      values: {
        label: 'Core values',
        background: 'white',
        columns: { default: 3, options: [2, 3] },
      },
      management: { label: 'Management team', background: 'tint' },
      cta: { label: 'Call-to-action banner', background: 'white' },
    },
  },
  services: {
    label: 'Services page',
    sections: {
      list: {
        label: 'Services',
        background: 'white',
        imagePosition: {
          default: 'alternate',
          options: ['alternate', 'left', 'right'],
        },
      },
      cta: { label: 'Call-to-action banner', background: 'white' },
    },
  },
  projects: {
    label: 'Projects page',
    sections: {
      projects: {
        label: 'Project list',
        background: 'white',
        columns: { default: 3, options: [2, 3] },
      },
      gallery: {
        label: 'Photo gallery',
        background: 'tint',
        columns: { default: 3, options: [2, 3, 4] },
      },
      clients: { label: 'Client logos', background: 'white' },
      cta: { label: 'Call-to-action banner', background: 'white' },
    },
  },
};

const defaultSection = (key: string, def: SectionDef): SectionConfig => ({
  key,
  visible: true,
  ...(def.background ? { background: def.background } : {}),
  ...(def.imagePosition ? { imagePosition: def.imagePosition.default } : {}),
  ...(def.columns ? { columns: def.columns.default } : {}),
});

/**
 * A page's sections in display order: the stored order and options for known
 * sections, with any section missing from the stored layout (e.g. added in a
 * later release) appended with its defaults. Invalid options fall back too.
 */
export function resolveLayout(
  stored: LayoutSetting | undefined | null,
  page: LayoutPage,
): SectionConfig[] {
  const defs = LAYOUT_PAGES[page].sections;
  const seen = new Set<string>();
  const result: SectionConfig[] = [];
  for (const s of stored?.[page] ?? []) {
    const def = defs[s.key];
    if (!def || seen.has(s.key)) continue;
    seen.add(s.key);
    const base = defaultSection(s.key, def);
    result.push({
      ...base,
      visible: s.visible !== false,
      ...(def.background && BACKGROUNDS.some((b) => b.value === s.background)
        ? { background: s.background }
        : {}),
      ...(def.imagePosition?.options.includes(s.imagePosition!)
        ? { imagePosition: s.imagePosition }
        : {}),
      ...(def.columns?.options.includes(s.columns!)
        ? { columns: s.columns }
        : {}),
      ...(def.background && s.backgroundImageId
        ? {
            backgroundImageId: s.backgroundImageId,
            backgroundOpacity: Math.min(Math.max(s.backgroundOpacity ?? DEFAULT_PHOTO_OPACITY, 5), 100),
          }
        : {}),
    });
  }
  // Sections missing from the stored layout (e.g. added in a later release)
  // go right after the section that precedes them in the default order.
  const defaultOrder = Object.keys(defs);
  defaultOrder.forEach((key, i) => {
    if (seen.has(key)) return;
    const prev = defaultOrder.slice(0, i).reverse().find((k) => result.some((r) => r.key === k));
    const at = prev ? result.findIndex((r) => r.key === prev) + 1 : 0;
    result.splice(at, 0, defaultSection(key, defs[key]));
  });
  return result;
}

export const resolveAllLayouts = (stored?: LayoutSetting | null) =>
  Object.fromEntries(
    (Object.keys(LAYOUT_PAGES) as LayoutPage[]).map((page) => [
      page,
      resolveLayout(stored, page),
    ]),
  ) as Record<LayoutPage, SectionConfig[]>;

/** Tailwind classes per background (literal strings so Tailwind keeps them). */
export const BACKGROUND_CLASS: Record<Background, string> = {
  white: 'bg-white',
  tint: 'bg-charcoal-50/60',
  dark: 'bg-charcoal-900',
  brand: 'bg-gold',
};

export const COLUMNS_CLASS: Record<Columns, string> = {
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
};
