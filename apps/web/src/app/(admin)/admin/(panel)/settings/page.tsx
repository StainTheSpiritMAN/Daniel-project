'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '../../_lib/api';
import { SETTINGS } from '../../_lib/schema';
import { useAdminUser } from '../../_components/AdminShell';
import { formatDate, PageTitle } from '../../_components/ui';

export default function SettingsIndexPage() {
  const user = useAdminUser();
  const [updated, setUpdated] = useState<Record<string, string | null>>({});

  useEffect(() => {
    api<{ key: string; updatedAt: string | null }[]>('/admin/settings')
      .then((list) => setUpdated(Object.fromEntries(list.map((s) => [s.key, s.updatedAt]))))
      .catch(() => {});
  }, []);

  const groups = [...new Set(Object.values(SETTINGS).map((s) => s.group))];

  return (
    <>
      <PageTitle
        title="Pages & settings"
        description="Text, images and contact details that appear once on the site. Lists such as services and projects are under Content."
      />
      <div className="space-y-8">
        {groups.map((group) => (
          <section key={group}>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-charcoal-700">{group}</h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Object.entries(SETTINGS)
                .filter(([, s]) => s.group === group && (!s.adminOnly || user.role === 'ADMIN'))
                .map(([key, s]) => (
                  <Link key={key} href={`/admin/settings/${key}`} className="adm-card block hover:border-gold-300">
                    <p className="font-bold text-charcoal-900">{s.label}</p>
                    <p className="mt-1 text-sm text-charcoal-700">{s.description}</p>
                    <p className="mt-3 text-xs text-charcoal-700/70">
                      {updated[key] ? `Last changed ${formatDate(updated[key])}` : 'Not set yet'}
                    </p>
                  </Link>
                ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
