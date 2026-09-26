'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '../_lib/api';
import { COLLECTIONS } from '../_lib/schema';
import { useAdminUser } from '../_components/AdminShell';
import { ErrorBox, formatDate, PageTitle, Spinner } from '../_components/ui';

type Summary = {
  counts: Record<string, number>;
  unreadMessages: number;
  recentActivity: {
    id: string;
    action: string;
    entity: string;
    createdAt: string;
    actor: { name: string } | null;
  }[];
};

const countKey: Record<string, string> = { 'why-us': 'whyUs' };

export default function DashboardPage() {
  const user = useAdminUser();
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api<Summary>('/admin/dashboard').then(setData).catch((e) => setError(e.message));
  }, []);

  return (
    <>
      <PageTitle
        title={`Welcome, ${user.name.split(' ')[0]}`}
        description="Changes you publish here appear on the website within a few seconds."
        actions={
          <a href="/" target="_blank" rel="noreferrer" className="adm-btn">
            View website ↗
          </a>
        }
      />
      {error && <ErrorBox message={error} />}
      {!data && !error && <Spinner />}
      {data && (
        <div className="grid gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            {data.unreadMessages > 0 && (
              <Link
                href="/admin/inbox"
                className="block rounded-xl border border-gold-200 bg-gold-50 p-5 font-semibold text-charcoal-900 hover:border-gold"
              >
                You have {data.unreadMessages} new message{data.unreadMessages === 1 ? '' : 's'} from the contact form →
              </Link>
            )}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {Object.entries(COLLECTIONS).map(([key, c]) => (
                <Link key={key} href={`/admin/content/${key}`} className="adm-card hover:border-gold-300">
                  <p className="text-2xl font-extrabold text-charcoal-900">{data.counts[countKey[key] ?? key] ?? 0}</p>
                  <p className="text-sm text-charcoal-700">{c.label}</p>
                </Link>
              ))}
              <Link href="/admin/media" className="adm-card hover:border-gold-300">
                <p className="text-2xl font-extrabold text-charcoal-900">{data.counts.media}</p>
                <p className="text-sm text-charcoal-700">Media files</p>
              </Link>
              <Link href="/admin/inbox?tab=newsletter" className="adm-card hover:border-gold-300">
                <p className="text-2xl font-extrabold text-charcoal-900">{data.counts.subscribers}</p>
                <p className="text-sm text-charcoal-700">Newsletter subscribers</p>
              </Link>
            </div>
            <div className="adm-card">
              <h2 className="font-bold text-charcoal-900">Quick links</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href="/admin/settings/hero" className="adm-btn">Homepage hero & video</Link>
                <Link href="/admin/settings/company" className="adm-btn">Phone, email & address</Link>
                <Link href="/admin/content/projects/new" className="adm-btn">Add a project</Link>
                <Link href="/admin/content/gallery/new" className="adm-btn">Add a gallery photo</Link>
              </div>
            </div>
          </div>
          <div className="adm-card">
            <h2 className="font-bold text-charcoal-900">Recent activity</h2>
            {data.recentActivity.length === 0 ? (
              <p className="mt-3 text-sm text-charcoal-700">Nothing yet.</p>
            ) : (
              <ul className="mt-3 space-y-3 text-sm">
                {data.recentActivity.map((a) => (
                  <li key={a.id}>
                    <p className="text-charcoal-900">
                      <span className="font-semibold">{a.actor?.name ?? 'System'}</span>{' '}
                      {a.action.toLowerCase().replace('_', ' ')} · {a.entity}
                    </p>
                    <p className="text-xs text-charcoal-700">{formatDate(a.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
}
