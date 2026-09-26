/**
 * Site colour themes. A theme is two colours — the brand colour and a dark
 * neutral — from which every shade used by the design is derived. Pure
 * functions: used by the root layout (to emit CSS variables) and by the admin
 * theme editor (for the live preview and readability checks).
 */

export type ThemeSetting = {
  preset: string;
  /** Custom brand colour, `#rrggbb` (only used when preset is "custom"). */
  brand?: string;
  /** Custom dark colour, `#rrggbb` (only used when preset is "custom"). */
  dark?: string;
};

type RGB = [number, number, number];

const GOLD_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const;

export const PRESETS: Record<string, { label: string; brand: string; dark: string }> = {
  gold: { label: 'Gold & Charcoal (original)', brand: '#E0A500', dark: '#1C1C1C' },
  green: { label: 'Solar Green', brand: '#2E9E4F', dark: '#14261B' },
  blue: { label: 'Energy Blue', brand: '#1F6FEB', dark: '#0F1B2D' },
  copper: { label: 'Copper', brand: '#D9772B', dark: '#231A14' },
};

/** The original scales, kept exact so the default theme is pixel-identical. */
const ORIGINAL_CHARCOAL: Record<number, string> = {
  50: '#F5F5F5', 100: '#E8E8E8', 700: '#383838', 800: '#2A2A2A', 900: '#1C1C1C',
};
const ORIGINAL_GOLD: Record<number, string> = {
  50: '#FDF8E7', 100: '#FBEFC2', 200: '#F6DE84', 300: '#F1CB46', 400: '#EBBA1A',
  500: '#E0A500', 600: '#B98700', 700: '#8F6800', 800: '#664A00', 900: '#3D2D00',
};

export const isHex = (v: unknown): v is string => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v);

const toRgb = (hex: string): RGB => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as RGB;
const toHex = (c: RGB) => `#${c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
const mix = (a: RGB, b: RGB, amount: number): RGB => a.map((v, i) => v + (b[i] - v) * amount) as RGB;
const WHITE: RGB = [255, 255, 255];
const BLACK: RGB = [0, 0, 0];

/** WCAG relative luminance and contrast ratio. */
const luminance = (c: RGB) => {
  const [r, g, b] = c.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const contrast = (a: string, b: string) => {
  const [l1, l2] = [luminance(toRgb(a)), luminance(toRgb(b))].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

/** Resolves a stored theme setting to its two base colours. */
export function themeColors(theme?: Partial<ThemeSetting> | null) {
  if (theme?.preset === 'custom' && isHex(theme.brand) && isHex(theme.dark)) {
    return { brand: theme.brand.toUpperCase(), dark: theme.dark.toUpperCase(), preset: 'custom' };
  }
  const preset = PRESETS[theme?.preset ?? ''] ? theme!.preset! : 'gold';
  return { ...PRESETS[preset], preset };
}

/** Every CSS colour the design uses, derived from the theme. */
export function buildPalette(theme?: Partial<ThemeSetting> | null) {
  const { brand, dark, preset } = themeColors(theme);
  const b = toRgb(brand);
  const d = toRgb(dark);

  const gold: Record<number, string> =
    preset === 'gold'
      ? ORIGINAL_GOLD
      : {
          50: toHex(mix(b, WHITE, 0.92)),
          100: toHex(mix(b, WHITE, 0.8)),
          200: toHex(mix(b, WHITE, 0.55)),
          300: toHex(mix(b, WHITE, 0.35)),
          400: toHex(mix(b, WHITE, 0.15)),
          500: brand,
          600: toHex(mix(b, BLACK, 0.17)),
          700: toHex(mix(b, BLACK, 0.36)),
          800: toHex(mix(b, BLACK, 0.55)),
          900: toHex(mix(b, BLACK, 0.73)),
        };
  const charcoal: Record<number, string> = preset === 'gold' ? ORIGINAL_CHARCOAL : {
    50: toHex(mix(d, WHITE, 0.96)),
    100: toHex(mix(d, WHITE, 0.9)),
    700: toHex(mix(d, WHITE, 0.12)),
    800: toHex(mix(d, WHITE, 0.06)),
    900: dark,
  };
  // Text on the brand colour: dark or white, whichever reads better.
  const onGold = contrast(brand, charcoal[900]) >= contrast(brand, '#FFFFFF') ? charcoal[900] : '#FFFFFF';

  return { gold, charcoal, onGold };
}

/** Readability checks shown to admins before they save a custom theme. */
export function themeChecks(theme?: Partial<ThemeSetting> | null) {
  const { gold, charcoal, onGold } = buildPalette(theme);
  return [
    { label: 'Button text on brand colour', ratio: contrast(gold[500], onGold), min: 4.5 },
    { label: 'Brand-coloured labels on white', ratio: contrast(gold[600], '#FFFFFF'), min: 3 },
    { label: 'Brand colour on dark sections', ratio: contrast(gold[500], charcoal[900]), min: 3 },
  ].map((c) => ({ ...c, ok: c.ratio >= c.min }));
}

/** CSS custom properties for a theme, as `r g b` triplets for Tailwind. */
export function themeVariables(theme?: Partial<ThemeSetting> | null): Record<string, string> {
  const { gold, charcoal, onGold } = buildPalette(theme);
  const channels = (hex: string) => toRgb(hex).join(' ');
  const vars: Record<string, string> = { '--on-gold': channels(onGold) };
  for (const step of GOLD_STEPS) vars[`--gold-${step}`] = channels(gold[step]);
  for (const [step, hex] of Object.entries(charcoal)) vars[`--charcoal-${step}`] = channels(hex);
  return vars;
}

export const themeCss = (theme?: Partial<ThemeSetting> | null) =>
  `:root{${Object.entries(themeVariables(theme))
    .map(([k, v]) => `${k}:${v}`)
    .join(';')}}`;
