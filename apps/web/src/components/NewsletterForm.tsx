'use client';

import { useState } from 'react';
import { subscribeNewsletter } from '@/lib/api';

export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>(
    'idle',
  );
  const [message, setMessage] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await subscribeNewsletter(email);
      setStatus('done');
      setMessage(res.message);
      setEmail('');
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Subscription failed.');
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email"
          className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-charcoal-100/40 focus:border-gold focus:outline-none"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="rounded-md bg-gold px-4 py-2 text-sm font-semibold text-on-gold transition hover:bg-gold-600 disabled:opacity-60"
        >
          {status === 'loading' ? '…' : 'Join'}
        </button>
      </div>
      {message && (
        <p
          className={`text-xs ${
            status === 'error' ? 'text-red-400' : 'text-gold-200'
          }`}
        >
          {message}
        </p>
      )}
    </form>
  );
}
