'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { api } from '../_lib/api';

function LoginForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('/auth/login', { method: 'POST', body: { email, password } });
      const next = params.get('next');
      // Only follow same-site admin paths.
      window.location.href = next && next.startsWith('/admin') && !next.startsWith('//') ? next : '/admin';
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-8 shadow-xl">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-gold-600">Suburban CMS</p>
        <h1 className="mt-1 text-2xl font-extrabold text-charcoal-900">Sign in</h1>
      </div>
      <label className="block">
        <span className="adm-label">Email</span>
        <input
          type="email"
          required
          autoComplete="username"
          className="adm-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <label className="block">
        <span className="adm-label">Password</span>
        <input
          type="password"
          required
          autoComplete="current-password"
          className="adm-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      {error && <p className="text-sm font-medium text-red-700">{error}</p>}
      <button type="submit" disabled={busy} className="adm-btn-primary w-full py-2.5">
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
      <p className="text-xs text-charcoal-700">Forgot your password? Ask an administrator to reset it.</p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-charcoal-900 p-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
