'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';
import { api, type AdminUser } from '../_lib/api';
import { COLLECTIONS } from '../_lib/schema';
import { Spinner, ToastProvider } from './ui';

const UserContext = createContext<AdminUser | null>(null);

/** The signed-in staff member (always set inside the admin panel). */
export const useAdminUser = () => useContext(UserContext)!;

type NavItem = { href: string; label: string; adminOnly?: boolean; badge?: number };

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [unread, setUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    api<AdminUser>('/auth/me')
      .then(setUser)
      .catch(() => router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`));
    // Only on first load; the API client handles expiry on later requests.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!user) return;
    api<{ unread: number }>('/admin/contact-messages/unread-count')
      .then((d) => setUnread(d.unread))
      .catch(() => {});
    setMenuOpen(false);
  }, [user, pathname]);

  async function signOut() {
    await api('/auth/logout', { method: 'POST' }).catch(() => {});
    window.location.href = '/admin/login';
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const sections: { title: string; items: NavItem[] }[] = [
    { title: '', items: [{ href: '/admin', label: 'Dashboard' }] },
    {
      title: 'Content',
      items: Object.entries(COLLECTIONS).map(([key, c]) => ({ href: `/admin/content/${key}`, label: c.label })),
    },
    {
      title: 'Site',
      items: [
        { href: '/admin/settings', label: 'Pages & settings' },
        { href: '/admin/media', label: 'Media library' },
        { href: '/admin/inbox', label: 'Inbox', badge: unread },
      ],
    },
    {
      title: 'Admin',
      items: [
        { href: '/admin/users', label: 'Users', adminOnly: true },
        { href: '/admin/audit', label: 'Activity log', adminOnly: true },
        { href: '/admin/account', label: 'My account' },
      ],
    },
  ];

  const isActive = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href));

  return (
    <UserContext.Provider value={user}>
      <ToastProvider>
        <div className="min-h-screen bg-charcoal-50/60 lg:flex">
          {/* Mobile top bar */}
          <div className="flex items-center justify-between bg-charcoal-900 px-4 py-3 text-white lg:hidden">
            <span className="font-extrabold">Suburban CMS</span>
            <button type="button" onClick={() => setMenuOpen((v) => !v)} className="rounded px-2 py-1 text-xl" aria-label="Menu">
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>

          <aside
            className={`${menuOpen ? 'block' : 'hidden'} w-full shrink-0 bg-charcoal-900 text-charcoal-100 lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-60 lg:flex-col`}
          >
            <div className="hidden px-5 py-5 lg:block">
              <p className="text-lg font-extrabold text-white">Suburban CMS</p>
              <a href="/" target="_blank" rel="noreferrer" className="text-xs text-gold-200 hover:text-gold">
                View website ↗
              </a>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 pb-4">
              {sections.map((section) => (
                <div key={section.title || 'home'} className="mt-3">
                  {section.title && (
                    <p className="px-2 pb-1 text-[11px] font-bold uppercase tracking-widest text-charcoal-100/40">
                      {section.title}
                    </p>
                  )}
                  {section.items
                    .filter((i) => !i.adminOnly || user.role === 'ADMIN')
                    .map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center justify-between rounded-md px-2 py-1.5 text-sm font-medium transition ${
                          isActive(item.href) ? 'bg-gold text-charcoal-900' : 'hover:bg-white/10'
                        }`}
                      >
                        {item.label}
                        {!!item.badge && (
                          <span className="rounded-full bg-red-600 px-1.5 text-xs font-bold text-white">{item.badge}</span>
                        )}
                      </Link>
                    ))}
                </div>
              ))}
            </nav>
            <div className="border-t border-white/10 px-5 py-4 text-sm">
              <p className="truncate font-semibold text-white">{user.name}</p>
              <p className="truncate text-xs text-charcoal-100/60">
                {user.email} · {user.role === 'ADMIN' ? 'Admin' : 'Editor'}
              </p>
              <button type="button" onClick={signOut} className="mt-2 text-xs font-semibold text-gold-200 hover:text-gold">
                Sign out
              </button>
            </div>
          </aside>

          <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
        </div>
      </ToastProvider>
    </UserContext.Provider>
  );
}
