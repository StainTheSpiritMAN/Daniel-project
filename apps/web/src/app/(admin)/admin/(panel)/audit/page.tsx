'use client';

import { Fragment, useEffect, useState } from 'react';
import { api } from '../../_lib/api';
import { useAdminUser } from '../../_components/AdminShell';
import { ErrorBox, formatDate, PageTitle, Spinner } from '../../_components/ui';

type Entry = {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  diff: unknown;
  createdAt: string;
  actor: { name: string; email: string } | null;
};

const PAGE = 50;

export default function AuditPage() {
  const me = useAdminUser();
  const [skip, setSkip] = useState(0);
  const [data, setData] = useState<{ items: Entry[]; total: number } | null>(null);
  const [error, setError] = useState('');
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    if (me.role !== 'ADMIN') return;
    api<{ items: Entry[]; total: number }>(`/admin/audit?skip=${skip}&take=${PAGE}`)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [skip, me.role]);

  if (me.role !== 'ADMIN') return <ErrorBox message="Only administrators can view the activity log." />;

  return (
    <>
      <PageTitle title="Activity log" description="Every change made in the dashboard, newest first. Click a row to see what changed." />
      {error && <ErrorBox message={error} />}
      {!data && !error && <Spinner />}
      {data && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] overflow-hidden rounded-xl border border-charcoal-100 bg-white text-sm">
              <thead className="bg-charcoal-50 text-left text-xs uppercase tracking-wider text-charcoal-700">
                <tr>
                  <th className="px-4 py-2">When</th>
                  <th className="px-4 py-2">Who</th>
                  <th className="px-4 py-2">Action</th>
                  <th className="px-4 py-2">What</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-100">
                {data.items.map((e) => (
                  <Fragment key={e.id}>
                    <tr className="cursor-pointer hover:bg-charcoal-50" onClick={() => setOpen(open === e.id ? null : e.id)}>
                      <td className="whitespace-nowrap px-4 py-2">{formatDate(e.createdAt)}</td>
                      <td className="px-4 py-2">{e.actor?.name ?? 'System'}</td>
                      <td className="px-4 py-2 font-semibold">{e.action}</td>
                      <td className="px-4 py-2">
                        {e.entity}
                        {e.entityId && <span className="ml-1 text-xs text-charcoal-700">{e.entityId}</span>}
                      </td>
                    </tr>
                    {open === e.id && (
                      <tr>
                        <td colSpan={4} className="bg-charcoal-50 px-4 py-3">
                          <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words text-xs">
                            {e.diff ? JSON.stringify(e.diff, null, 2) : 'No details'}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-charcoal-700">
              {data.total === 0 ? 'No entries' : `${skip + 1}–${Math.min(skip + PAGE, data.total)} of ${data.total}`}
            </span>
            <div className="flex gap-2">
              <button type="button" className="adm-btn" disabled={skip === 0} onClick={() => setSkip(Math.max(0, skip - PAGE))}>
                ← Newer
              </button>
              <button type="button" className="adm-btn" disabled={skip + PAGE >= data.total} onClick={() => setSkip(skip + PAGE)}>
                Older →
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
