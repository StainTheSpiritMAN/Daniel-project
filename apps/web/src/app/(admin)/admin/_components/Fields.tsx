'use client';

import { useEffect, useState } from 'react';
import { api, type Media } from '../_lib/api';
import type { Field } from '../_lib/schema';
import { MediaLibrary, MediaThumb } from './MediaLibrary';
import { Modal } from './ui';

type Value = Record<string, unknown>;
type Errors = Record<string, string>;

/** Renders a list of schema fields bound to `value`. */
export function Fields({
  fields,
  value,
  onChange,
  errors,
  prefix = '',
}: {
  fields: Field[];
  value: Value;
  onChange: (next: Value) => void;
  errors: Errors;
  prefix?: string;
}) {
  const set = (name: string, v: unknown) => onChange({ ...value, [name]: v });
  return (
    <div className="space-y-5">
      {fields.map((f) => (
        <FieldInput
          key={f.name}
          field={f}
          value={value?.[f.name]}
          onChange={(v) => set(f.name, v)}
          errors={errors}
          path={prefix + f.name}
          siblings={value}
        />
      ))}
    </div>
  );
}

function Label({ field, count }: { field: Field; count?: { n: number; max: number } }) {
  return (
    <div className="mb-1 flex items-baseline justify-between gap-3">
      <span className="adm-label mb-0">
        {field.label}
        {field.required && <span className="text-red-600"> *</span>}
      </span>
      {count && (
        <span className={`text-xs tabular-nums ${count.n > count.max ? 'font-bold text-red-700' : 'text-charcoal-700/60'}`}>
          {count.n}/{count.max}
        </span>
      )}
    </div>
  );
}

function Help({ field, error }: { field: Field; error?: string }) {
  return (
    <>
      {error && <p className="mt-1 text-xs font-semibold text-red-700">{error}</p>}
      {field.help && <p className="mt-1 text-xs text-charcoal-700/80">{field.help}</p>}
    </>
  );
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

function FieldInput({
  field,
  value,
  onChange,
  errors,
  path,
  siblings,
}: {
  field: Field;
  value: unknown;
  onChange: (v: unknown) => void;
  errors: Errors;
  path: string;
  siblings: Value;
}) {
  const error = errors[path];
  const invalid = error ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : '';

  switch (field.type) {
    case 'text':
    case 'textarea':
    case 'slug': {
      const s = (value as string) ?? '';
      const max = field.max;
      return (
        <div>
          <Label field={field} count={{ n: s.length, max }} />
          {field.type === 'textarea' ? (
            <textarea
              className={`adm-input ${invalid}`}
              rows={field.rows ?? 3}
              value={s}
              onChange={(e) => onChange(e.target.value)}
            />
          ) : (
            <div className="flex gap-2">
              <input
                className={`adm-input ${invalid}`}
                value={s}
                placeholder={field.type === 'text' ? field.placeholder : undefined}
                onChange={(e) => onChange(field.type === 'slug' ? e.target.value.toLowerCase() : e.target.value)}
              />
              {field.type === 'slug' && (
                <button
                  type="button"
                  className="adm-btn shrink-0"
                  onClick={() => onChange(slugify(String(siblings[field.from] ?? '')))}
                >
                  From title
                </button>
              )}
            </div>
          )}
          <Help field={field} error={error} />
        </div>
      );
    }

    case 'list':
    case 'emails': {
      const items = (value as string[]) ?? [];
      const update = (next: string[]) => onChange(next);
      const itemLabel = field.type === 'emails' ? 'email' : field.itemLabel;
      return (
        <div>
          <Label field={field} />
          <div className="space-y-2">
            {items.map((item, i) => {
              const itemError = errors[`${path}.${i}`];
              const common = {
                className: `adm-input ${itemError ? 'border-red-400' : ''}`,
                value: item,
                onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                  update(items.map((x, j) => (j === i ? e.target.value : x))),
              };
              return (
                <div key={i}>
                  <div className="flex items-start gap-2">
                    {field.type === 'list' && field.multiline ? (
                      <textarea rows={4} {...common} />
                    ) : (
                      <input type={field.type === 'emails' ? 'email' : 'text'} {...common} />
                    )}
                    <RowButtons index={i} count={items.length} items={items} onChange={update} />
                  </div>
                  {itemError && <p className="mt-1 text-xs font-semibold text-red-700">{itemError}</p>}
                  {field.type === 'list' && item.length > field.max && (
                    <p className="mt-1 text-xs text-red-700">
                      {item.length}/{field.max} characters
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          {items.length < field.maxItems && (
            <button type="button" className="adm-btn mt-2" onClick={() => update([...items, ''])}>
              + Add {itemLabel}
            </button>
          )}
          <Help field={field} error={error} />
        </div>
      );
    }

    case 'media':
      return (
        <div>
          <Label field={field} />
          <MediaField id={(value as string) ?? null} kind={field.kind} onChange={onChange} invalid={!!error} />
          {field.hint && <p className="mt-1 text-xs text-charcoal-700/80">{field.hint}</p>}
          <Help field={field} error={error} />
        </div>
      );

    case 'group':
      return (
        <fieldset className="rounded-lg border border-charcoal-100 p-4">
          <legend className="px-1 text-sm font-bold text-charcoal-900">{field.label}</legend>
          <Fields
            fields={field.fields}
            value={(value as Value) ?? {}}
            onChange={onChange}
            errors={errors}
            prefix={`${path}.`}
          />
        </fieldset>
      );

    case 'repeater': {
      const rows = (value as Value[]) ?? [];
      return (
        <div>
          <Label field={field} />
          <div className="space-y-3">
            {rows.map((row, i) => (
              <div key={i} className="flex gap-2 rounded-lg border border-charcoal-100 p-3">
                <div className="flex-1">
                  <Fields
                    fields={field.fields}
                    value={row}
                    onChange={(next) => onChange(rows.map((r, j) => (j === i ? next : r)))}
                    errors={errors}
                    prefix={`${path}.${i}.`}
                  />
                </div>
                <RowButtons index={i} count={rows.length} items={rows} onChange={onChange} />
              </div>
            ))}
          </div>
          {rows.length < field.maxItems && (
            <button
              type="button"
              className="adm-btn mt-2"
              onClick={() => onChange([...rows, Object.fromEntries(field.fields.map((f) => [f.name, '']))])}
            >
              + Add {field.itemLabel}
            </button>
          )}
          <Help field={field} error={error} />
        </div>
      );
    }
  }
}

/** Move up / move down / remove controls for list rows. */
function RowButtons<T>({
  index,
  count,
  items,
  onChange,
}: {
  index: number;
  count: number;
  items: T[];
  onChange: (next: T[]) => void;
}) {
  const move = (to: number) => {
    const next = [...items];
    [next[index], next[to]] = [next[to], next[index]];
    onChange(next);
  };
  const btn = 'flex h-8 w-8 items-center justify-center rounded border border-charcoal-100 text-sm hover:bg-charcoal-50 disabled:opacity-30';
  return (
    <div className="flex shrink-0 gap-1">
      <button type="button" className={btn} disabled={index === 0} onClick={() => move(index - 1)} aria-label="Move up">
        ↑
      </button>
      <button type="button" className={btn} disabled={index === count - 1} onClick={() => move(index + 1)} aria-label="Move down">
        ↓
      </button>
      <button
        type="button"
        className={`${btn} text-red-700`}
        onClick={() => onChange(items.filter((_, j) => j !== index))}
        aria-label="Remove"
      >
        ✕
      </button>
    </div>
  );
}

const mediaCache = new Map<string, Promise<Media>>();
const fetchMedia = (id: string) => {
  if (!mediaCache.has(id)) {
    const p = api<Media>(`/admin/media/${id}`);
    p.catch(() => mediaCache.delete(id));
    mediaCache.set(id, p);
  }
  return mediaCache.get(id)!;
};

function MediaField({
  id,
  kind,
  onChange,
  invalid,
}: {
  id: string | null;
  kind: 'IMAGE' | 'VIDEO';
  onChange: (id: string | null) => void;
  invalid: boolean;
}) {
  const [media, setMedia] = useState<Media | null>(null);
  const [missing, setMissing] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setMissing(false);
    if (!id) return setMedia(null);
    let live = true;
    fetchMedia(id)
      .then((m) => live && setMedia(m))
      .catch(() => live && setMissing(true));
    return () => {
      live = false;
    };
  }, [id]);

  return (
    <div className={`flex items-center gap-4 rounded-lg border p-3 ${invalid ? 'border-red-400' : 'border-charcoal-100'}`}>
      <div className="h-20 w-28 shrink-0 overflow-hidden rounded bg-charcoal-50">
        {media && id ? (
          <MediaThumb media={media} />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-charcoal-700/60">
            {missing ? 'File missing' : 'None'}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        {media && id && <p className="truncate text-sm font-medium text-charcoal-900">{media.filename}</p>}
        {media && id && media.kind === 'IMAGE' && (
          <p className="truncate text-xs text-charcoal-700">{media.alt || 'No description'}</p>
        )}
        <div className="mt-2 flex gap-2">
          <button type="button" className="adm-btn" onClick={() => setOpen(true)}>
            {id ? 'Replace…' : `Choose ${kind === 'VIDEO' ? 'video' : 'image'}…`}
          </button>
          {id && (
            <button type="button" className="adm-btn" onClick={() => onChange(null)}>
              Remove
            </button>
          )}
        </div>
      </div>
      {open && (
        <Modal title={`Choose ${kind === 'VIDEO' ? 'a video' : 'an image'}`} onClose={() => setOpen(false)} wide>
          <MediaLibrary
            mode="pick"
            kind={kind}
            onPick={(m) => {
              mediaCache.set(m.id, Promise.resolve(m));
              setMedia(m);
              onChange(m.id);
              setOpen(false);
            }}
          />
        </Modal>
      )}
    </div>
  );
}
