'use client';

import { useRef, useState } from 'react';
import { InlineText, RichText } from '@/components/RichText';

type Mode = 'block' | 'inline';
type El = HTMLInputElement | HTMLTextAreaElement;

/**
 * Text box with a small formatting toolbar. Formatting is stored as simple
 * markers (**bold**, *italic*, [text](url), "- " lists) that the site renders
 * safely; editors use the buttons and the preview, not the markers.
 */
export function FormattedInput({
  value,
  onChange,
  mode,
  multiline,
  rows = 4,
  className,
}: {
  value: string;
  onChange: (next: string) => void;
  mode: Mode;
  multiline: boolean;
  rows?: number;
  className: string;
}) {
  const ref = useRef<El>(null);
  const [preview, setPreview] = useState(false);

  /** Replaces the current selection and restores a sensible cursor/selection. */
  function apply(transform: (selected: string) => { text: string; selectInner?: [number, number] }) {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const { text, selectInner } = transform(value.slice(start, end));
    onChange(value.slice(0, start) + text + value.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      const [a, b] = selectInner ?? [text.length, text.length];
      el.setSelectionRange(start + a, start + b);
    });
  }

  const wrap = (marker: string, placeholder: string) =>
    apply((sel) => {
      const inner = sel || placeholder;
      return { text: `${marker}${inner}${marker}`, selectInner: [marker.length, marker.length + inner.length] };
    });

  function link() {
    const url = window.prompt('Link address (e.g. https://example.com, /contact or mailto:name@example.com)');
    if (!url) return;
    apply((sel) => {
      const label = sel || 'link text';
      return { text: `[${label}](${url.trim()})`, selectInner: [1, 1 + label.length] };
    });
  }

  function list(ordered: boolean) {
    const el = ref.current;
    if (!el) return;
    // Expand the selection to whole lines, then prefix each line.
    const start = value.lastIndexOf('\n', (el.selectionStart ?? 0) - 1) + 1;
    const endIdx = value.indexOf('\n', el.selectionEnd ?? value.length);
    const end = endIdx === -1 ? value.length : endIdx;
    const lines = (value.slice(start, end) || 'List item').split('\n');
    const text = lines
      .map((l, i) => `${ordered ? `${i + 1}. ` : '- '}${l.replace(/^\s*([-*•]|\d+[.)])\s+/, '')}`)
      .join('\n');
    // Lists need a blank line before them to start a new block.
    const before = value.slice(0, start);
    const gap = before && !before.endsWith('\n\n') ? (before.endsWith('\n') ? '\n' : '\n\n') : '';
    onChange(before + gap + text + value.slice(end));
    requestAnimationFrame(() => el.focus());
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!(e.metaKey || e.ctrlKey)) return;
    if (e.key === 'b') {
      e.preventDefault();
      wrap('**', 'bold text');
    } else if (e.key === 'i') {
      e.preventDefault();
      wrap('*', 'italic text');
    }
  }

  const btn = 'rounded px-2 py-1 text-sm font-semibold text-charcoal-800 hover:bg-charcoal-50 disabled:opacity-40';
  const common = {
    className: `${className} rounded-t-none`,
    value,
    onKeyDown,
    onChange: (e: React.ChangeEvent<El>) => onChange(e.target.value),
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-0.5 rounded-t-md border border-b-0 border-charcoal-100 bg-charcoal-50/60 px-1 py-0.5">
        <button type="button" className={btn} title="Bold (Ctrl/⌘+B)" disabled={preview} onClick={() => wrap('**', 'bold text')}>
          <strong>B</strong>
        </button>
        <button type="button" className={btn} title="Italic (Ctrl/⌘+I)" disabled={preview} onClick={() => wrap('*', 'italic text')}>
          <em className="font-serif">I</em>
        </button>
        <button type="button" className={btn} title="Link" disabled={preview} onClick={link}>
          🔗 Link
        </button>
        {mode === 'block' && multiline && (
          <>
            <button type="button" className={btn} title="Bullet list" disabled={preview} onClick={() => list(false)}>
              • List
            </button>
            <button type="button" className={btn} title="Numbered list" disabled={preview} onClick={() => list(true)}>
              1. List
            </button>
          </>
        )}
        <button type="button" className={`${btn} ml-auto`} onClick={() => setPreview((v) => !v)}>
          {preview ? 'Edit' : 'Preview'}
        </button>
      </div>
      {preview ? (
        <div className="min-h-[2.6rem] space-y-3 rounded-b-md border border-charcoal-100 bg-white px-3 py-2 text-sm leading-relaxed text-charcoal-800">
          {value.trim() ? mode === 'block' ? <RichText text={value} /> : <InlineText text={value} /> : <span className="text-charcoal-700/50">Nothing to preview</span>}
        </div>
      ) : multiline ? (
        <textarea ref={ref as React.Ref<HTMLTextAreaElement>} rows={rows} {...common} />
      ) : (
        <input ref={ref as React.Ref<HTMLInputElement>} {...common} />
      )}
    </div>
  );
}
