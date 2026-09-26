'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { api, download } from '../../_lib/api';
import { ErrorBox, formatDate, PageTitle, Spinner, useToast } from '../../_components/ui';

type Status = 'NEW' | 'READ' | 'ARCHIVED';
type Message = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  service: string | null;
  message: string;
  status: Status;
  createdAt: string;
};
type Subscriber = { id: string; email: string; createdAt: string; unsubscribedAt: string | null };

function Messages() {
  const notify = useToast();
  const [filter, setFilter] = useState<Status | ''>('');
  const [data, setData] = useState<{ items: Message[]; total: number } | null>(null);
  const [open, setOpen] = useState<Message | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    const q = filter ? `?status=${filter}&take=100` : '?take=100';
    api<{ items: Message[]; total: number }>(`/admin/contact-messages${q}`)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [filter]);

  useEffect(load, [load]);

  async function setStatus(m: Message, status: Status) {
    try {
      const updated = await api<Message>(`/admin/contact-messages/${m.id}/status`, { method: 'PATCH', body: { status } });
      setData((d) => d && { ...d, items: d.items.map((x) => (x.id === m.id ? updated : x)) });
      setOpen((o) => (o?.id === m.id ? updated : o));
      return updated;
    } catch (e) {
      notify((e as Error).message, 'error');
    }
  }

  function view(m: Message) {
    setOpen(m);
    if (m.status === 'NEW') setStatus(m, 'READ');
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_26rem]">
      <div>
        <div className="mb-3 flex gap-2">
          {([['', 'All'], ['NEW', 'New'], ['READ', 'Read'], ['ARCHIVED', 'Archived']] as const).map(([v, label]) => (
            <button
              key={v}
              type="button"
              onClick={() => setFilter(v)}
              className={filter === v ? 'adm-btn-primary' : 'adm-btn'}
            >
              {label}
            </button>
          ))}
        </div>
        {error && <ErrorBox message={error} />}
        {!data && !error && <Spinner />}
        {data && data.items.length === 0 && <p className="adm-card text-sm text-charcoal-700">No messages.</p>}
        {data && data.items.length > 0 && (
          <ul className="divide-y divide-charcoal-100 overflow-hidden rounded-xl border border-charcoal-100 bg-white">
            {data.items.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => view(m)}
                  className={`block w-full px-4 py-3 text-left hover:bg-charcoal-50 ${open?.id === m.id ? 'bg-gold-50' : ''}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className={`truncate text-sm ${m.status === 'NEW' ? 'font-bold text-charcoal-900' : 'text-charcoal-800'}`}>
                      {m.status === 'NEW' && <span className="mr-2 inline-block h-2 w-2 rounded-full bg-red-600" />}
                      {m.name}
                    </p>
                    <span className="shrink-0 text-xs text-charcoal-700">{formatDate(m.createdAt)}</span>
                  </div>
                  <p className="truncate text-sm text-charcoal-700">{m.subject || m.service || m.message}</p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        {open ? (
          <div className="adm-card space-y-4">
            <div>
              <p className="text-lg font-bold text-charcoal-900">{open.name}</p>
              <p className="text-xs text-charcoal-700">{formatDate(open.createdAt)}</p>
            </div>
            <dl className="grid grid-cols-[5rem_1fr] gap-y-1 text-sm">
              <dt className="text-charcoal-700">Email</dt>
              <dd><a className="text-gold-700" href={`mailto:${open.email}`}>{open.email}</a></dd>
              {open.phone && (<><dt className="text-charcoal-700">Phone</dt><dd><a className="text-gold-700" href={`tel:${open.phone}`}>{open.phone}</a></dd></>)}
              {open.service && (<><dt className="text-charcoal-700">Service</dt><dd>{open.service}</dd></>)}
              {open.subject && (<><dt className="text-charcoal-700">Subject</dt><dd>{open.subject}</dd></>)}
            </dl>
            <p className="whitespace-pre-line rounded-lg bg-charcoal-50 p-3 text-sm text-charcoal-900">{open.message}</p>
            <div className="flex flex-wrap gap-2">
              <a
                className="adm-btn-primary"
                href={`mailto:${open.email}?subject=${encodeURIComponent(`Re: ${open.subject || open.service || 'Your enquiry'}`)}`}
              >
                Reply by email
              </a>
              {open.status !== 'ARCHIVED' ? (
                <button type="button" className="adm-btn" onClick={() => setStatus(open, 'ARCHIVED')}>Archive</button>
              ) : (
                <button type="button" className="adm-btn" onClick={() => setStatus(open, 'READ')}>Move to inbox</button>
              )}
              {open.status === 'READ' && (
                <button type="button" className="adm-btn" onClick={() => setStatus(open, 'NEW')}>Mark unread</button>
              )}
            </div>
          </div>
        ) : (
          <div className="adm-card text-sm text-charcoal-700">Select a message to read it.</div>
        )}
      </aside>
    </div>
  );
}

function Newsletter() {
  const notify = useToast();
  const [items, setItems] = useState<Subscriber[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api<Subscriber[]>('/admin/newsletter').then(setItems).catch((e) => setError(e.message));
  }, []);

  async function toggle(s: Subscriber) {
    try {
      const updated = await api<Subscriber>(`/admin/newsletter/${s.id}`, {
        method: 'PATCH',
        body: { subscribed: !!s.unsubscribedAt },
      });
      setItems((list) => list && list.map((x) => (x.id === s.id ? updated : x)));
    } catch (e) {
      notify((e as Error).message, 'error');
    }
  }

  const active = items?.filter((s) => !s.unsubscribedAt).length ?? 0;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm text-charcoal-700">{active} active subscriber{active === 1 ? '' : 's'}</p>
        <button
          type="button"
          className="adm-btn"
          onClick={() =>
            download('/admin/newsletter/export.csv', 'newsletter-subscribers.csv').catch((e) =>
              notify((e as Error).message, 'error'),
            )
          }
        >
          Download CSV
        </button>
      </div>
      {error && <ErrorBox message={error} />}
      {!items && !error && <Spinner />}
      {items && items.length === 0 && <p className="adm-card text-sm text-charcoal-700">No subscribers yet.</p>}
      {items && items.length > 0 && (
        <table className="w-full overflow-hidden rounded-xl border border-charcoal-100 bg-white text-sm">
          <thead className="bg-charcoal-50 text-left text-xs uppercase tracking-wider text-charcoal-700">
            <tr>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Joined</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-charcoal-100">
            {items.map((s) => (
              <tr key={s.id} className={s.unsubscribedAt ? 'text-charcoal-700/50' : ''}>
                <td className="px-4 py-2">{s.email}</td>
                <td className="px-4 py-2">{formatDate(s.createdAt)}</td>
                <td className="px-4 py-2 text-right">
                  <button type="button" className="adm-btn" onClick={() => toggle(s)}>
                    {s.unsubscribedAt ? 'Resubscribe' : 'Unsubscribe'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function Inbox() {
  const params = useSearchParams();
  const router = useRouter();
  const tab = params.get('tab') === 'newsletter' ? 'newsletter' : 'messages';

  return (
    <>
      <PageTitle title="Inbox" description="Messages from the website contact form and newsletter sign-ups." />
      <div className="mb-5 flex gap-1 border-b border-charcoal-100">
        {(['messages', 'newsletter'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => router.replace(t === 'messages' ? '/admin/inbox' : '/admin/inbox?tab=newsletter')}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold ${
              tab === t ? 'border-gold text-charcoal-900' : 'border-transparent text-charcoal-700 hover:text-charcoal-900'
            }`}
          >
            {t === 'messages' ? 'Contact messages' : 'Newsletter'}
          </button>
        ))}
      </div>
      {tab === 'messages' ? <Messages /> : <Newsletter />}
    </>
  );
}

export default function InboxPage() {
  return (
    <Suspense>
      <Inbox />
    </Suspense>
  );
}
