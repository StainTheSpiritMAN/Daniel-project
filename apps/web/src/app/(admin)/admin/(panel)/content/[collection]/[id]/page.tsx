'use client';

import Link from 'next/link';
import { notFound, useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../../../../_lib/api';
import { COLLECTIONS, emptyValue, toPayload, validate, type Field } from '../../../../_lib/schema';
import { Fields } from '../../../../_components/Fields';
import { ErrorBox, PageTitle, Spinner, StatusPill, useToast, useUnsavedWarning } from '../../../../_components/ui';

type Row = Record<string, unknown> & { id: string; status: 'DRAFT' | 'PUBLISHED' };

/** Picks the editable fields out of an API row. */
function toFormValue(fields: Field[], row: Row) {
  const base = emptyValue(fields);
  for (const f of fields) {
    const v = row[f.name];
    if (v !== null && v !== undefined) base[f.name] = v;
  }
  return base;
}

export default function CollectionEditPage() {
  const { collection, id } = useParams<{ collection: string; id: string }>();
  const config = COLLECTIONS[collection];
  const router = useRouter();
  const notify = useToast();
  const isNew = id === 'new';

  const [row, setRow] = useState<Row | null>(null);
  const [initial, setInitial] = useState<Record<string, unknown> | null>(isNew && config ? emptyValue(config.fields) : null);
  const [value, setValue] = useState<Record<string, unknown> | null>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!config || isNew) return;
    api<Row>(`/admin/${collection}/${id}`)
      .then((r) => {
        const v = toFormValue(config.fields, r);
        setRow(r);
        setInitial(v);
        setValue(v);
      })
      .catch((e) => setServerError(e.message));
  }, [collection, id, isNew, config]);

  const dirty = useMemo(() => JSON.stringify(initial) !== JSON.stringify(value), [initial, value]);
  useUnsavedWarning(dirty && !busy);

  if (!config) notFound();

  async function save(status?: 'DRAFT' | 'PUBLISHED') {
    if (!value) return;
    const found = validate(config.fields, value);
    setErrors(found);
    if (Object.keys(found).length) {
      setServerError('Please fix the highlighted fields.');
      return;
    }
    setBusy(true);
    setServerError('');
    try {
      const body = { ...toPayload(config.fields, value, true), ...(status ? { status } : {}) };
      const saved = isNew
        ? await api<Row>(`/admin/${collection}`, { method: 'POST', body })
        : await api<Row>(`/admin/${collection}/${id}`, { method: 'PATCH', body });

      notify(
        saved.status === 'PUBLISHED'
          ? 'Saved — live on the site in a few seconds'
          : 'Saved as draft (not visible on the site)',
      );
      if (isNew) {
        setInitial(value); // avoid the unsaved-changes prompt while navigating
        router.replace(`/admin/content/${collection}/${saved.id}`);
      } else {
        const v = toFormValue(config.fields, saved);
        setRow(saved);
        setInitial(v);
        setValue(v);
      }
    } catch (e) {
      setServerError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!row || !window.confirm(`Delete "${config.primary(row)}"? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await api(`/admin/${collection}/${id}`, { method: 'DELETE' });
      notify('Deleted');
      setInitial(value);
      router.replace(`/admin/content/${collection}`);
    } catch (e) {
      setServerError((e as Error).message);
      setBusy(false);
    }
  }

  const published = row?.status === 'PUBLISHED';

  return (
    <>
      <Link href={`/admin/content/${collection}`} className="text-sm font-semibold text-gold-700 hover:text-gold-600">
        ← {config.label}
      </Link>
      <PageTitle
        title={isNew ? `New ${config.singular}` : row ? config.primary(row) || `Edit ${config.singular}` : 'Loading…'}
        actions={row && <StatusPill status={row.status} />}
      />

      {!value && !serverError && <Spinner />}
      {value && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          className="max-w-3xl space-y-6"
        >
          <div className="adm-card">
            <Fields fields={config.fields} value={value} onChange={setValue} errors={errors} />
          </div>

          {serverError && <ErrorBox message={serverError} />}

          <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-2 border-t border-charcoal-100 bg-white/95 px-4 py-3 backdrop-blur md:mx-0 md:rounded-xl md:border">
            {isNew ? (
              <>
                <button type="button" className="adm-btn-primary" disabled={busy} onClick={() => save('PUBLISHED')}>
                  Save & publish
                </button>
                <button type="button" className="adm-btn" disabled={busy} onClick={() => save('DRAFT')}>
                  Save as draft
                </button>
              </>
            ) : (
              <>
                <button type="submit" className="adm-btn-primary" disabled={busy || !dirty}>
                  {busy ? 'Saving…' : published ? 'Save changes' : 'Save draft'}
                </button>
                {published ? (
                  <button type="button" className="adm-btn" disabled={busy} onClick={() => save('DRAFT')}>
                    Unpublish
                  </button>
                ) : (
                  <button type="button" className="adm-btn" disabled={busy} onClick={() => save('PUBLISHED')}>
                    {dirty ? 'Save & publish' : 'Publish'}
                  </button>
                )}
                <button type="button" className="adm-btn-danger ml-auto" disabled={busy} onClick={remove}>
                  Delete
                </button>
              </>
            )}
            {dirty && <span className="text-xs font-medium text-amber-700">Unsaved changes</span>}
          </div>
        </form>
      )}
    </>
  );
}
