'use client';

import { useEffect } from 'react';
import { buildPalette, PRESETS, themeChecks, themeColors, themeVariables, type ThemeSetting } from '@/lib/theme';

/**
 * Live preview of a theme, rendered with the theme's CSS variables scoped to
 * this box, plus the readability checks for text on brand colours.
 */
export function ThemePreview({
  value,
  onChange,
}: {
  value: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
}) {
  const theme = value as Partial<ThemeSetting>;

  // Switching to "Custom" starts from the colours of the current preset.
  useEffect(() => {
    if (theme.preset === 'custom' && (!theme.brand || !theme.dark)) {
      const base = PRESETS.gold;
      onChange({ ...value, brand: theme.brand || base.brand, dark: theme.dark || base.dark });
    }
  }, [theme.preset, theme.brand, theme.dark, value, onChange]);

  const { gold, charcoal } = buildPalette(theme);
  const checks = themeChecks(theme);
  const { brand } = themeColors(theme);

  return (
    <div className="adm-card space-y-4">
      <h2 className="font-bold text-charcoal-900">Preview</h2>
      <div style={themeVariables(theme) as React.CSSProperties} data-tone="light" className="overflow-hidden rounded-lg border border-charcoal-100">
        <div className="bg-charcoal-900 p-6 text-white">
          <span className="eyebrow text-gold-200">Our services</span>
          <p className="text-2xl font-extrabold">
            Smart, sustainable <span className="text-gold">energy</span> solutions
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <span className="btn-primary px-4 py-2 text-sm">Request a Quote</span>
            <span className="inline-flex items-center rounded-md border-2 border-white/30 px-4 py-2 text-sm font-semibold">Our Services</span>
          </div>
        </div>
        <div className="grid gap-4 bg-white p-6 sm:grid-cols-2">
          <div className="rounded-xl border border-charcoal-100 p-4">
            <span className="eyebrow mb-1 text-xs">Why choose us</span>
            <p className="font-bold text-charcoal-900">Qualified professionals</p>
            <p className="text-sm text-charcoal-700">Certified technicians, engineers and consultants.</p>
          </div>
          <div className="rounded-xl bg-gold p-4 text-on-gold">
            <p className="font-extrabold">Our Mission</p>
            <p className="text-sm">Text on the brand colour.</p>
          </div>
        </div>
        <div className="flex">
          {Object.values(gold).map((c) => (
            <span key={c} className="h-6 flex-1" style={{ background: c }} title={c} />
          ))}
          {Object.values(charcoal).map((c) => (
            <span key={`c${c}`} className="h-6 flex-1" style={{ background: c }} title={c} />
          ))}
        </div>
      </div>

      <ul className="space-y-1 text-sm">
        {checks.map((c) => (
          <li key={c.label} className={c.ok ? 'text-green-700' : 'text-amber-700'}>
            {c.ok ? '✓' : '⚠'} {c.label} — contrast {c.ratio.toFixed(1)}:1 {c.ok ? '' : `(aim for ${c.min}:1 or more)`}
          </li>
        ))}
      </ul>
      {checks.some((c) => !c.ok) && (
        <p className="text-xs text-amber-700">
          Some text may be hard to read with {brand}. Try a deeper or brighter shade — you can still save if you are happy with it.
        </p>
      )}
    </div>
  );
}
