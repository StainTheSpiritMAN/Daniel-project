'use client';

import { useEffect, useState } from 'react';
import { api, type AdminUser } from '../../_lib/api';
import { useAdminUser } from '../../_components/AdminShell';
import { ErrorBox, formatDate, Modal, PageTitle, Spinner, useToast } from '../../_components/ui';

type User = AdminUser & { isActive: boolean; lastLoginAt: string | null; createdAt: string };
type Draft = { name: string; email: string; role: User['role']; password: string };

const ROLE_HELP = {
  EDITOR: 'Can edit and publish all content, upload media and read the inbox.',
  ADMIN: 'Everything an editor can do, plus manage users, SEO settings and view the activity log.',
};

export default function UsersPage() {
  const me = useAdminUser();
  const notify = useToast();
  const [users, setUsers] = useState<User[] | null>(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<User | 'new' | null>(null);

  const load = () => api<User[]>('/admin/users').then(setUsers).catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);

  if (me.role !== 'ADMIN') return <ErrorBox message="Only administrators can manage users." />;

  async function setActive(u: User, isActive: boolean) {
    if (!isActive && !window.confirm(`Deactivate ${u.name}? They will be signed out and unable to log in.`)) return;
    try {
      await api(`/admin/users/${u.id}`, { method: 'PATCH', body: { isActive } });
      notify(isActive ? 'Account re-activated' : 'Account deactivated');
      load();
    } catch (e) {
      notify((e as Error).message, 'error');
    }
  }

  return (
    <>
      <PageTitle
        title="Users"
        description="People who can sign in to this dashboard. Accounts are deactivated rather than deleted so the activity log stays complete."
        actions={
          <button type="button" className="adm-btn-primary" onClick={() => setEditing('new')}>
            + Add user
          </button>
        }
      />
      {error && <ErrorBox message={error} />}
      {!users && !error && <Spinner />}
      {users && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] overflow-hidden rounded-xl border border-charcoal-100 bg-white text-sm">
            <thead className="bg-charcoal-50 text-left text-xs uppercase tracking-wider text-charcoal-700">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2">Last sign-in</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-100">
              {users.map((u) => (
                <tr key={u.id} className={u.isActive ? '' : 'text-charcoal-700/50'}>
                  <td className="px-4 py-2">
                    <p className="font-semibold">
                      {u.name} {u.id === me.id && <span className="text-xs font-normal">(you)</span>}
                    </p>
                    <p className="text-xs">{u.email}</p>
                  </td>
                  <td className="px-4 py-2">
                    {u.role === 'ADMIN' ? 'Admin' : 'Editor'}
                    {!u.isActive && ' · Deactivated'}
                  </td>
                  <td className="px-4 py-2">{formatDate(u.lastLoginAt)}</td>
                  <td className="space-x-2 whitespace-nowrap px-4 py-2 text-right">
                    <button type="button" className="adm-btn" onClick={() => setEditing(u)}>
                      Edit
                    </button>
                    {u.id !== me.id &&
                      (u.isActive ? (
                        <button type="button" className="adm-btn-danger" onClick={() => setActive(u, false)}>
                          Deactivate
                        </button>
                      ) : (
                        <button type="button" className="adm-btn" onClick={() => setActive(u, true)}>
                          Re-activate
                        </button>
                      ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editing && (
        <UserForm
          user={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </>
  );
}

function UserForm({ user, onClose, onSaved }: { user: User | null; onClose: () => void; onSaved: () => void }) {
  const notify = useToast();
  const [draft, setDraft] = useState<Draft>({
    name: user?.name ?? '',
    email: user?.email ?? '',
    role: user?.role ?? 'EDITOR',
    password: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user && draft.password.length < 10) return setError('Password must be at least 10 characters.');
    if (user && draft.password && draft.password.length < 10) return setError('New password must be at least 10 characters.');
    setBusy(true);
    setError('');
    try {
      const body: Partial<Draft> = { name: draft.name, email: draft.email, role: draft.role };
      if (draft.password) body.password = draft.password;
      await api(user ? `/admin/users/${user.id}` : '/admin/users', { method: user ? 'PATCH' : 'POST', body });
      notify(user ? 'User updated' : 'User created — share the password with them securely');
      onSaved();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <Modal title={user ? `Edit ${user.name}` : 'Add user'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          <span className="adm-label">Full name</span>
          <input className="adm-input" required maxLength={120} value={draft.name} onChange={(e) => set('name', e.target.value)} />
        </label>
        <label className="block">
          <span className="adm-label">Email</span>
          <input className="adm-input" type="email" required value={draft.email} onChange={(e) => set('email', e.target.value)} />
        </label>
        <label className="block">
          <span className="adm-label">Role</span>
          <select className="adm-input" value={draft.role} onChange={(e) => set('role', e.target.value as Draft['role'])}>
            <option value="EDITOR">Editor</option>
            <option value="ADMIN">Admin</option>
          </select>
          <span className="mt-1 block text-xs text-charcoal-700">{ROLE_HELP[draft.role]}</span>
        </label>
        <label className="block">
          <span className="adm-label">{user ? 'Reset password (optional)' : 'Temporary password'}</span>
          <input
            className="adm-input"
            type="text"
            autoComplete="new-password"
            minLength={user ? undefined : 10}
            required={!user}
            value={draft.password}
            onChange={(e) => set('password', e.target.value)}
            placeholder="At least 10 characters"
          />
          <span className="mt-1 block text-xs text-charcoal-700">
            {user ? 'Leave empty to keep their current password. Resetting signs them out everywhere.' : 'Ask them to change it from "My account" after signing in.'}
          </span>
        </label>
        {error && <ErrorBox message={error} />}
        <div className="flex justify-end gap-2">
          <button type="button" className="adm-btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="adm-btn-primary" disabled={busy}>
            {busy ? 'Saving…' : user ? 'Save' : 'Create user'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
