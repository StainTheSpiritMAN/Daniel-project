'use client';

import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../../../_lib/api';
import { emptyValue, SETTINGS, toPayload, validate, type Field } from '../../../_lib/schema';
import { useAdminUser } from '../../../_components/AdminShell';
import { Fields } from '../../../_components/Fields';
import { ThemePreview } from '../../../_components/ThemePreview';
import { ErrorBox, PageTitle, Spinner, useToast, useUnsavedWarning } from '../../../_components/ui';

type Value = Record<string, unknown>;

/** Fills gaps in a stored value with empty defaults, recursively. */
function withDefaults(fields: Field[], stored: Value | null): Value {
  const base = emptyValue(fields);
  if (!stored) return base;
  for (const f of fields) {
    const v = stored[f.name];
    if (v === undefined || v === null) continue;
    base[f.name] = f.type === 'group' ? withDefaults(f.fields, v as Value) : v;
  }
  return base;
}

/** Pages whose content this setting controls, for the "view on site" link. */
const PREVIEW: Record<string, string> = {
  hero: '/',
  theme: '/',
  branding: '/',
  home: '/',
  missionVision: '/',
  about: '/about',
  ceo: '/about',
  servicesPage: '/services',
  projectsPage: '/projects',
  contactPage: '/contact',
};

export default function SettingEditPage() {
  const { key } = useParams<{ key: string }>();
  const config = SETTINGS[key];
  const user = useAdminUser();
  const notify = useToast();
  const [initial, setInitial] = useState<Value | null>(null);
  const [value, setValue] = useState<Value | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!config) return;
    api<{ value: Value | null }>(`/admin/settings/${key}`)
      .then(({ value: stored }) => {
        const v = withDefaults(config.fields, stored);
        setInitial(v);
        setValue(v);
      })
      .catch((e) => setServerError(e.message));
  }, [key, config]);

  const dirty = useMemo(() => JSON.stringify(initial) !== JSON.stringify(value), [initial, value]);
  useUnsavedWarning(dirty && !busy);

  if (!config) notFound();
  const readOnly = config.adminOnly && user.role !== 'ADMIN';

  async function save(e: React.FormEvent) {
    e.preventDefault();
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
      const res = await api<{ value: Value }>(`/admin/settings/${key}`, {
        method: 'PUT',
        body: toPayload(config.fields, value),
      });
      const v = withDefaults(config.fields, res.value);
      setInitial(v);
      setValue(v);
      notify('Saved — live on the site in a few seconds');
    } catch (err) {
      setServerError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Link href="/admin/settings" className="text-sm font-semibold text-gold-700 hover:text-gold-600">
        ← Pages & settings
      </Link>
      <PageTitle
        title={config.label}
        description={config.description}
        actions={
          <a href={PREVIEW[key] ?? '/'} target="_blank" rel="noreferrer" className="adm-btn">
            View on site ↗
          </a>
        }
      />
      {readOnly && <ErrorBox message="Only administrators can change these settings." />}
      {!value && !serverError && <Spinner />}
      {value && !readOnly && (
        <form onSubmit={save} className="max-w-3xl space-y-6">
          <div className="adm-card">
            <Fields fields={config.fields} value={value} onChange={setValue} errors={errors} />
          </div>
          {key === 'theme' && <ThemePreview value={value} onChange={setValue} />}
          {serverError && <ErrorBox message={serverError} />}
          <div className="sticky bottom-0 -mx-4 flex items-center gap-3 border-t border-charcoal-100 bg-white/95 px-4 py-3 backdrop-blur md:mx-0 md:rounded-xl md:border">
            <button type="submit" className="adm-btn-primary" disabled={busy || !dirty}>
              {busy ? 'Saving…' : 'Save & publish'}
            </button>
            {dirty && (
              <>
                <button type="button" className="adm-btn" onClick={() => { setValue(initial); setErrors({}); setServerError(''); }}>
                  Discard changes
                </button>
                <span className="text-xs font-medium text-amber-700">Unsaved changes</span>
              </>
            )}
          </div>
        </form>
      )}
    </>
  );
}
