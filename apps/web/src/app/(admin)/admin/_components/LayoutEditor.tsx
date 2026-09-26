'use client';

import { useState } from 'react';
import {
  BACKGROUNDS,
  LAYOUT_PAGES,
  resolveLayout,
  type Background,
  type Columns,
  type ImagePosition,
  type LayoutPage,
  type SectionConfig,
} from '@/lib/layout';

const SWATCH: Record<Background, string> = {
  white: 'bg-white',
  tint: 'bg-charcoal-50',
  dark: 'bg-charcoal-900',
  brand: 'bg-gold',
};

const POSITION_LABEL: Record<ImagePosition, string> = {
  left: 'Photo on the left',
  right: 'Photo on the right',
  alternate: 'Alternate sides',
};

const PREVIEW_PATH: Record<LayoutPage, string> = {
  home: '/',
  about: '/about',
  services: '/services',
  projects: '/projects',
};

/**
 * Per-page section editor: order (drag or arrows), visibility, background,
 * image side and columns. `value` holds every page's full section list.
 */
export function LayoutEditor({
  value,
  onChange,
}: {
  value: Record<LayoutPage, SectionConfig[]>;
  onChange: (next: Record<LayoutPage, SectionConfig[]>) => void;
}) {
  const [page, setPage] = useState<LayoutPage>('home');
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const sections = value[page];
  const defs = LAYOUT_PAGES[page].sections;

  const setSections = (next: SectionConfig[]) => onChange({ ...value, [page]: next });
  const update = (i: number, patch: Partial<SectionConfig>) =>
    setSections(sections.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const move = (from: number, to: number) => {
    if (to < 0 || to >= sections.length || from === to) return;
    const next = [...sections];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setSections(next);
  };

  return (
    <div className="adm-card space-y-4">
      <div className="flex flex-wrap items-center gap-1 border-b border-charcoal-100">
        {(Object.keys(LAYOUT_PAGES) as LayoutPage[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPage(p)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-semibold ${
              page === p ? 'border-gold text-charcoal-900' : 'border-transparent text-charcoal-700 hover:text-charcoal-900'
            }`}
          >
            {LAYOUT_PAGES[p].label}
          </button>
        ))}
        <a href={PREVIEW_PATH[page]} target="_blank" rel="noreferrer" className="ml-auto pb-2 text-xs font-semibold text-gold-700">
          View page ↗
        </a>
      </div>

      <p className="text-sm text-charcoal-700">
        Drag sections (or use the arrows) to reorder them. The page banner always stays at the top.
      </p>

      <ul className="space-y-2">
        {sections.map((s, i) => {
          const def = defs[s.key];
          return (
            <li
              key={s.key}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex !== null) move(dragIndex, i);
                setDragIndex(null);
              }}
              onDragEnd={() => setDragIndex(null)}
              className={`flex flex-wrap items-center gap-3 rounded-lg border border-charcoal-100 bg-white px-3 py-2.5 ${
                dragIndex === i ? 'opacity-40' : ''
              } ${s.visible ? '' : 'bg-charcoal-50/60'}`}
            >
              <span className="cursor-grab select-none text-charcoal-700/50" aria-hidden>
                ⋮⋮
              </span>
              <div className="flex flex-col">
                <button type="button" className="text-xs leading-none disabled:opacity-20" disabled={i === 0} onClick={() => move(i, i - 1)} aria-label="Move up">
                  ▲
                </button>
                <button type="button" className="text-xs leading-none disabled:opacity-20" disabled={i === sections.length - 1} onClick={() => move(i, i + 1)} aria-label="Move down">
                  ▼
                </button>
              </div>
              <label className="flex min-w-[12rem] flex-1 items-center gap-2 text-sm font-semibold text-charcoal-900">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-gold"
                  checked={s.visible}
                  onChange={(e) => update(i, { visible: e.target.checked })}
                />
                <span className={s.visible ? '' : 'text-charcoal-700/50 line-through'}>{def.label}</span>
              </label>

              {def.background && (
                <div className="flex items-center gap-1" role="radiogroup" aria-label={`${def.label} background`}>
                  {BACKGROUNDS.map((b) => (
                    <button
                      key={b.value}
                      type="button"
                      role="radio"
                      aria-checked={s.background === b.value}
                      title={b.label}
                      disabled={!s.visible}
                      onClick={() => update(i, { background: b.value })}
                      className={`h-7 w-7 rounded-full border ${SWATCH[b.value]} ${
                        s.background === b.value ? 'ring-2 ring-gold ring-offset-2' : 'border-charcoal-100'
                      } disabled:opacity-30`}
                    >
                      <span className="sr-only">{b.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {def.imagePosition && (
                <select
                  className="adm-input w-auto py-1.5"
                  disabled={!s.visible}
                  value={s.imagePosition}
                  onChange={(e) => update(i, { imagePosition: e.target.value as ImagePosition })}
                  aria-label={`${def.label} photo position`}
                >
                  {def.imagePosition.options.map((o) => (
                    <option key={o} value={o}>
                      {POSITION_LABEL[o]}
                    </option>
                  ))}
                </select>
              )}

              {def.columns && (
                <select
                  className="adm-input w-auto py-1.5"
                  disabled={!s.visible}
                  value={s.columns}
                  onChange={(e) => update(i, { columns: Number(e.target.value) as Columns })}
                  aria-label={`${def.label} columns`}
                >
                  {def.columns.options.map((o) => (
                    <option key={o} value={o}>
                      {o} columns
                    </option>
                  ))}
                </select>
              )}
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        className="adm-btn"
        onClick={() => {
          if (window.confirm(`Reset the ${LAYOUT_PAGES[page].label} to its original layout?`)) {
            setSections(resolveLayout(null, page));
          }
        }}
      >
        Reset this page to the original layout
      </button>
    </div>
  );
}
