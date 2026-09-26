'use client';

import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { api, type Media } from '../../../_lib/api';
import { COLLECTIONS } from '../../../_lib/schema';
import { MediaThumb } from '../../../_components/MediaLibrary';
import { ErrorBox, PageTitle, Spinner, StatusPill, useToast } from '../../../_components/ui';

type Row = Record<string, unknown> & { id: string; status: 'DRAFT' | 'PUBLISHED' };

export default function CollectionListPage() {
  const { collection } = useParams<{ collection: string }>();
  const config = COLLECTIONS[collection];
  const notify = useToast();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState('');
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    api<Row[]>(`/admin/${collection}`)
      .then(setRows)
      .catch((e) => setError(e.message));
  }, [collection]);

  useEffect(() => {
    if (config) load();
  }, [config, load]);

  if (!config) notFound();

  async function saveOrder(next: Row[]) {
    const previous = rows;
    setRows(next);
    try {
      await api(`/admin/${collection}/reorder`, { method: 'POST', body: { ids: next.map((r) => r.id) } });
      notify('Order saved');
    } catch (e) {
      setRows(previous);
      notify((e as Error).message, 'error');
    }
  }

  function move(from: number, to: number) {
    if (!rows || to < 0 || to >= rows.length || from === to) return;
    const next = [...rows];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    saveOrder(next);
  }

  async function toggleStatus(row: Row) {
    setBusyId(row.id);
    const action = row.status === 'PUBLISHED' ? 'unpublish' : 'publish';
    try {
      const updated = await api<Row>(`/admin/${collection}/${row.id}/${action}`, { method: 'POST' });
      setRows((rs) => rs && rs.map((r) => (r.id === row.id ? updated : r)));
      notify(action === 'publish' ? 'Published — now live on the site' : 'Unpublished — hidden from the site');
    } catch (e) {
      notify((e as Error).message, 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function remove(row: Row) {
    if (!window.confirm(`Delete "${config.primary(row)}"? This cannot be undone.`)) return;
    setBusyId(row.id);
    try {
      await api(`/admin/${collection}/${row.id}`, { method: 'DELETE' });
      setRows((rs) => rs && rs.filter((r) => r.id !== row.id));
      notify('Deleted');
    } catch (e) {
      notify((e as Error).message, 'error');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <PageTitle
        title={config.label}
        description={config.sortable === false ? config.description : `${config.description} Drag rows to change the order on the site.`}
        actions={
          <Link href={`/admin/content/${collection}/new`} className="adm-btn-primary">
            + Add {config.singular}
          </Link>
        }
      />
      {error && <ErrorBox message={error} />}
      {!rows && !error && <Spinner />}
      {rows && rows.length === 0 && (
        <div className="adm-card text-center text-sm text-charcoal-700">
          Nothing here yet.{' '}
          <Link href={`/admin/content/${collection}/new`} className="font-semibold text-gold-700">
            Add the first {config.singular}
          </Link>
        </div>
      )}
      {rows && rows.length > 0 && (
        <ul className="divide-y divide-charcoal-100 overflow-hidden rounded-xl border border-charcoal-100 bg-white">
          {rows.map((row, i) => {
            const thumb = config.thumb ? (row[config.thumb] as Media | null) : undefined;
            return (
              <li
                key={row.id}
                draggable={config.sortable !== false}
                onDragStart={() => setDragIndex(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragIndex !== null) move(dragIndex, i);
                  setDragIndex(null);
                }}
                onDragEnd={() => setDragIndex(null)}
                className={`flex items-center gap-3 px-3 py-3 ${dragIndex === i ? 'opacity-40' : ''}`}
              >
                {config.sortable !== false && (
                  <>
                    <span className="cursor-grab select-none px-1 text-charcoal-700/50" title="Drag to reorder" aria-hidden>
                      ⋮⋮
                    </span>
                    <div className="flex flex-col">
                      <button type="button" className="text-xs leading-none text-charcoal-700 disabled:opacity-20" disabled={i === 0} onClick={() => move(i, i - 1)} aria-label="Move up">
                        ▲
                      </button>
                      <button type="button" className="text-xs leading-none text-charcoal-700 disabled:opacity-20" disabled={i === rows.length - 1} onClick={() => move(i, i + 1)} aria-label="Move down">
                        ▼
                      </button>
                    </div>
                  </>
                )}
                {config.thumb && (
                  <div className="h-12 w-16 shrink-0 overflow-hidden rounded bg-charcoal-50">
                    {thumb && <MediaThumb media={thumb} />}
                  </div>
                )}
                <Link href={`/admin/content/${collection}/${row.id}`} className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-charcoal-900 hover:text-gold-700">{config.primary(row)}</p>
                  {config.secondary && <p className="truncate text-sm text-charcoal-700">{config.secondary(row)}</p>}
                </Link>
                <StatusPill status={row.status} />
                <div className="hidden gap-2 sm:flex">
                  <button type="button" className="adm-btn" disabled={busyId === row.id} onClick={() => toggleStatus(row)}>
                    {row.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                  </button>
                  <Link href={`/admin/content/${collection}/${row.id}`} className="adm-btn">
                    Edit
                  </Link>
                  <button type="button" className="adm-btn-danger" disabled={busyId === row.id} onClick={() => remove(row)}>
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
