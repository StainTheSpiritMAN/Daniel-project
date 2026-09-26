'use client';

import { useState } from 'react';
import { api } from '../../_lib/api';
import { useAdminUser } from '../../_components/AdminShell';
import { ErrorBox, PageTitle, useToast } from '../../_components/ui';

export default function AccountPage() {
  const user = useAdminUser();
  const notify = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (next.length < 10) return setError('New password must be at least 10 characters.');
    if (next !== confirm) return setError('The new passwords do not match.');
    setBusy(true);
    setError('');
    try {
      await api('/auth/change-password', { method: 'POST', body: { currentPassword: current, newPassword: next } });
      notify('Password changed. Other devices have been signed out.');
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageTitle title="My account" description={`${user.name} · ${user.email}`} />
      <form onSubmit={submit} className="adm-card max-w-md space-y-4">
        <h2 className="font-bold text-charcoal-900">Change password</h2>
        <label className="block">
          <span className="adm-label">Current password</span>
          <input className="adm-input" type="password" autoComplete="current-password" required value={current} onChange={(e) => setCurrent(e.target.value)} />
        </label>
        <label className="block">
          <span className="adm-label">New password</span>
          <input className="adm-input" type="password" autoComplete="new-password" required value={next} onChange={(e) => setNext(e.target.value)} />
          <span className="mt-1 block text-xs text-charcoal-700">At least 10 characters. A short sentence is easy to remember and hard to guess.</span>
        </label>
        <label className="block">
          <span className="adm-label">Repeat new password</span>
          <input className="adm-input" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </label>
        {error && <ErrorBox message={error} />}
        <button type="submit" className="adm-btn-primary" disabled={busy}>
          {busy ? 'Saving…' : 'Change password'}
        </button>
      </form>
    </>
  );
}
