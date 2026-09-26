'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { mediaUrl } from '@/lib/media';
import { api, ApiError, thumbPath, uploadMedia, type Media } from '../_lib/api';
import { ErrorBox, formatBytes, formatDate, Spinner, useToast } from './ui';

type Kind = Media['kind'];
type Page = { items: Media[]; total: number };

const ACCEPT: Record<Kind | 'ALL', string> = {
  IMAGE: 'image/jpeg,image/png,image/webp',
  VIDEO: 'video/mp4,video/webm',
  DOCUMENT: 'application/pdf',
  ALL: 'image/jpeg,image/png,image/webp,video/mp4,video/webm,application/pdf',
};

const KIND_LABEL: Record<Kind, string> = { IMAGE: 'Images', VIDEO: 'Videos', DOCUMENT: 'Documents' };

export function MediaThumb({ media, className = '' }: { media: Media; className?: string }) {
  const src = thumbPath(media);
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={mediaUrl(src)} alt={media.alt} className={`h-full w-full object-cover ${className}`} loading="lazy" />;
  }
  return (
    <div className={`flex h-full w-full items-center justify-center bg-charcoal-50 text-xs font-bold text-charcoal-700 ${className}`}>
      {media.kind === 'VIDEO' ? '▶ VIDEO' : 'PDF'}
    </div>
  );
}

/**
 * Browse, upload and manage media. In "pick" mode it becomes a chooser that
 * returns one item (and insists on alt text for images before using them).
 */
export function MediaLibrary({
  mode = 'manage',
  kind,
  onPick,
}: {
  mode?: 'manage' | 'pick';
  kind?: Kind;
  onPick?: (media: Media) => void;
}) {
  const notify = useToast();
  const [filter, setFilter] = useState<Kind | ''>(kind ?? '');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState<Page | null>(null);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Media | null>(null);
  const [uploads, setUploads] = useState<{ name: string; progress: number }[]>([]);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(
    async (skip = 0) => {
      try {
        const params = new URLSearchParams({ skip: String(skip), take: '40' });
        if (filter) params.set('kind', filter);
        if (query.trim()) params.set('q', query.trim());
        const res = await api<Page>(`/admin/media?${params}`);
        setPage((prev) => (skip && prev ? { ...res, items: [...prev.items, ...res.items] } : res));
        setError('');
      } catch (e) {
        setError((e as Error).message);
      }
    },
    [filter, query],
  );

  useEffect(() => {
    const t = setTimeout(() => load(0), query ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, query]);

  async function handleFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (!list.length) return;
    let last: Media | null = null;
    for (const file of list) {
      setUploads((u) => [...u, { name: file.name, progress: 0 }]);
      try {
        last = await uploadMedia(file, '', (p) =>
          setUploads((u) => u.map((x) => (x.name === file.name ? { ...x, progress: p } : x))),
        );
        notify(`Uploaded ${file.name}`);
      } catch (e) {
        notify(`${file.name}: ${(e as Error).message}`, 'error');
      } finally {
        setUploads((u) => u.filter((x) => x.name !== file.name));
      }
    }
    await load(0);
    if (last) setSelected(last);
  }

  function onUpdated(media: Media) {
    setSelected(media);
    setPage((p) => p && { ...p, items: p.items.map((m) => (m.id === media.id ? media : m)) });
  }

  function onDeleted(id: string) {
    setSelected(null);
    setPage((p) => p && { total: p.total - 1, items: p.items.filter((m) => m.id !== id) });
  }

  return (
    <div className={mode === 'manage' ? 'grid gap-6 lg:grid-cols-[1fr_20rem]' : ''}>
      <div>
        {/* Toolbar */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or description"
            className="adm-input max-w-xs"
          />
          {!kind && (
            <select value={filter} onChange={(e) => setFilter(e.target.value as Kind | '')} className="adm-input w-auto">
              <option value="">All files</option>
              {(Object.keys(KIND_LABEL) as Kind[]).map((k) => (
                <option key={k} value={k}>
                  {KIND_LABEL[k]}
                </option>
              ))}
            </select>
          )}
          <button type="button" className="adm-btn-primary ml-auto" onClick={() => fileInput.current?.click()}>
            ↑ Upload
          </button>
          <input
            ref={fileInput}
            type="file"
            hidden
            multiple={mode === 'manage'}
            accept={ACCEPT[kind ?? 'ALL']}
            onChange={(e) => {
              if (e.target.files) handleFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </div>

        {/* Drop zone + uploads in progress */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFiles(e.dataTransfer.files);
          }}
          className={`mb-4 rounded-lg border-2 border-dashed px-4 py-4 text-center text-sm transition ${
            dragging ? 'border-gold bg-gold-50 text-charcoal-900' : 'border-charcoal-100 text-charcoal-700'
          }`}
        >
          Drag files here to upload · JPG, PNG, WebP up to 15 MB · MP4, WebM up to 200 MB · PDF up to 20 MB
          {uploads.map((u) => (
            <div key={u.name} className="mx-auto mt-2 max-w-sm text-left">
              <div className="flex justify-between text-xs">
                <span className="truncate">{u.name}</span>
                <span>{u.progress < 1 ? `${Math.round(u.progress * 100)}%` : 'Processing…'}</span>
              </div>
              <div className="mt-1 h-1.5 rounded bg-charcoal-100">
                <div className="h-1.5 rounded bg-gold transition-all" style={{ width: `${u.progress * 100}%` }} />
              </div>
            </div>
          ))}
        </div>

        {error && <ErrorBox message={error} />}
        {!page && !error && <Spinner />}
        {page && page.items.length === 0 && (
          <p className="py-10 text-center text-sm text-charcoal-700">No files yet. Upload one to get started.</p>
        )}

        {/* Grid */}
        {page && page.items.length > 0 && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
              {page.items.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelected(m)}
                  className={`group overflow-hidden rounded-lg border text-left transition ${
                    selected?.id === m.id ? 'border-gold ring-2 ring-gold' : 'border-charcoal-100 hover:border-gold-300'
                  }`}
                >
                  <div className="relative aspect-[4/3] bg-charcoal-50">
                    <MediaThumb media={m} />
                    {m.kind === 'IMAGE' && !m.alt && (
                      <span className="absolute left-1.5 top-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                        Needs description
                      </span>
                    )}
                  </div>
                  <p className="truncate px-2 py-1.5 text-xs font-medium text-charcoal-800">{m.filename}</p>
                </button>
              ))}
            </div>
            {page.items.length < page.total && (
              <div className="mt-4 text-center">
                <button type="button" className="adm-btn" onClick={() => load(page.items.length)}>
                  Load more ({page.total - page.items.length} remaining)
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {mode === 'manage' ? (
        <aside className="lg:sticky lg:top-6 lg:self-start">
          {selected ? (
            <MediaDetails key={selected.id} media={selected} onUpdated={onUpdated} onDeleted={onDeleted} />
          ) : (
            <div className="adm-card text-sm text-charcoal-700">Select a file to see its details.</div>
          )}
        </aside>
      ) : (
        selected && <PickBar key={selected.id} media={selected} onUpdated={onUpdated} onPick={onPick!} />
      )}
    </div>
  );
}

/** Sticky footer in pick mode: preview, alt text (required for images), and "Use". */
function PickBar({
  media,
  onUpdated,
  onPick,
}: {
  media: Media;
  onUpdated: (m: Media) => void;
  onPick: (m: Media) => void;
}) {
  const [alt, setAlt] = useState(media.alt);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const needsAlt = media.kind === 'IMAGE';

  async function use() {
    if (needsAlt && !alt.trim()) {
      setError('Describe the image briefly first — this helps visually-impaired visitors and search engines.');
      return;
    }
    setBusy(true);
    try {
      let result = media;
      if (alt.trim() !== media.alt) {
        result = await api<Media>(`/admin/media/${media.id}`, { method: 'PATCH', body: { alt: alt.trim() } });
        onUpdated(result);
      }
      onPick(result);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="sticky bottom-0 -mx-5 -mb-5 mt-4 flex flex-wrap items-end gap-4 border-t border-charcoal-100 bg-white p-4">
      <div className="h-16 w-24 shrink-0 overflow-hidden rounded bg-charcoal-50">
        <MediaThumb media={media} />
      </div>
      {needsAlt && (
        <label className="min-w-[14rem] flex-1">
          <span className="adm-label">Image description (alt text)</span>
          <input
            className="adm-input"
            value={alt}
            maxLength={300}
            onChange={(e) => {
              setAlt(e.target.value);
              setError('');
            }}
            placeholder="e.g. Engineers installing rooftop solar panels"
          />
        </label>
      )}
      <button type="button" className="adm-btn-primary" onClick={use} disabled={busy}>
        {busy ? 'Saving…' : 'Use this file'}
      </button>
      {error && <p className="w-full text-sm text-red-700">{error}</p>}
    </div>
  );
}

function MediaDetails({
  media,
  onUpdated,
  onDeleted,
}: {
  media: Media;
  onUpdated: (m: Media) => void;
  onDeleted: (id: string) => void;
}) {
  const notify = useToast();
  const [alt, setAlt] = useState(media.alt);
  const [filename, setFilename] = useState(media.filename);
  const [usedBy, setUsedBy] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<Media & { usedBy: string[] }>(`/admin/media/${media.id}`)
      .then((m) => setUsedBy(m.usedBy))
      .catch(() => setUsedBy([]));
  }, [media.id]);

  const dirty = alt !== media.alt || filename !== media.filename;
  const url = mediaUrl(media.path)!;

  async function save() {
    setBusy(true);
    try {
      const updated = await api<Media>(`/admin/media/${media.id}`, {
        method: 'PATCH',
        body: { alt: alt.trim(), filename: filename.trim() || media.filename },
      });
      onUpdated(updated);
      notify('Saved');
    } catch (e) {
      notify((e as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm(`Delete "${media.filename}" permanently?`)) return;
    setBusy(true);
    try {
      await api(`/admin/media/${media.id}`, { method: 'DELETE' });
      onDeleted(media.id);
      notify('File deleted');
    } catch (e) {
      const data = (e as ApiError).data as { usedBy?: string[] } | undefined;
      notify(data?.usedBy ? `${(e as Error).message}\nUsed in: ${data.usedBy.join(', ')}` : (e as Error).message, 'error');
      setBusy(false);
    }
  }

  return (
    <div className="adm-card space-y-4">
      <div className="overflow-hidden rounded-lg bg-charcoal-50">
        {media.kind === 'VIDEO' ? (
          <video src={url} poster={mediaUrl(media.variants.poster)} controls muted className="w-full" />
        ) : media.kind === 'IMAGE' ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaUrl(media.variants.md?.webp ?? media.path)} alt={media.alt} className="w-full" />
        ) : (
          <a href={url} target="_blank" rel="noreferrer" className="block p-6 text-center text-sm font-semibold text-gold-700">
            Open PDF ↗
          </a>
        )}
      </div>

      <label className="block">
        <span className="adm-label">Name</span>
        <input className="adm-input" value={filename} maxLength={120} onChange={(e) => setFilename(e.target.value)} />
      </label>
      {media.kind === 'IMAGE' && (
        <label className="block">
          <span className="adm-label">Description (alt text)</span>
          <textarea
            className="adm-input"
            rows={2}
            maxLength={300}
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            placeholder="What does the image show?"
          />
          {!alt.trim() && <span className="mt-1 block text-xs text-amber-700">Required before the image can be used on the site.</span>}
        </label>
      )}

      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-charcoal-700">
        {media.width && (
          <>
            <dt>Dimensions</dt>
            <dd>
              {media.width} × {media.height}
            </dd>
          </>
        )}
        <dt>Size</dt>
        <dd>{formatBytes(media.sizeBytes)}</dd>
        <dt>Uploaded</dt>
        <dd>{formatDate(media.createdAt)}</dd>
      </dl>

      <div className="text-xs">
        <p className="font-semibold text-charcoal-800">Used in</p>
        {usedBy === null ? (
          <p className="text-charcoal-700">Checking…</p>
        ) : usedBy.length ? (
          <ul className="mt-1 list-inside list-disc text-charcoal-700">
            {usedBy.map((u) => (
              <li key={u}>{u}</li>
            ))}
          </ul>
        ) : (
          <p className="text-charcoal-700">Not used anywhere</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" className="adm-btn-primary" onClick={save} disabled={!dirty || busy}>
          Save
        </button>
        <button
          type="button"
          className="adm-btn"
          onClick={() => navigator.clipboard.writeText(url).then(() => notify('Link copied'))}
        >
          Copy link
        </button>
        <button type="button" className="adm-btn-danger ml-auto" onClick={remove} disabled={busy || !!usedBy?.length}>
          Delete
        </button>
      </div>
    </div>
  );
}
