'use client';

import { useState } from 'react';
import { sendContactMessage, type ContactPayload } from '@/lib/api';

const empty: ContactPayload = {
  name: '',
  email: '',
  phone: '',
  service: '',
  subject: '',
  message: '',
  website: '',
};

export function ContactForm({ services }: { services: string[] }) {
  const [form, setForm] = useState<ContactPayload>(empty);
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>(
    'idle',
  );
  const [feedback, setFeedback] = useState('');

  function update<K extends keyof ContactPayload>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setFeedback('');
    try {
      const res = await sendContactMessage(form);
      setStatus('done');
      setFeedback(res.message);
      setForm(empty);
    } catch (err) {
      setStatus('error');
      setFeedback(err instanceof Error ? err.message : 'Submission failed.');
    }
  }

  const inputClass =
    'w-full rounded-md border border-charcoal-100 bg-white px-4 py-2.5 text-sm text-charcoal-900 placeholder:text-charcoal-700/50 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold';

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Honeypot: hidden from people; bots that fill it are ignored by the API. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
        value={form.website}
        onChange={(e) => update('website', e.target.value)}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-charcoal-800">
            Full name *
          </label>
          <input
            required
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            className={inputClass}
            placeholder="Jane Doe"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-charcoal-800">
            Email *
          </label>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            className={inputClass}
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-charcoal-800">
            Phone
          </label>
          <input
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
            className={inputClass}
            placeholder="0801 234 5678"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-charcoal-800">
            Service of interest
          </label>
          <select
            value={form.service}
            onChange={(e) => update('service', e.target.value)}
            className={inputClass}
          >
            <option value="">Select a service</option>
            {services.map((title) => (
              <option key={title} value={title}>
                {title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-charcoal-800">
          Subject
        </label>
        <input
          value={form.subject}
          onChange={(e) => update('subject', e.target.value)}
          className={inputClass}
          placeholder="How can we help?"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-charcoal-800">
          Message *
        </label>
        <textarea
          required
          rows={5}
          value={form.message}
          onChange={(e) => update('message', e.target.value)}
          className={inputClass}
          placeholder="Tell us about your project (at least 10 characters)…"
        />
      </div>

      <button
        type="submit"
        disabled={status === 'loading'}
        className="btn-primary w-full disabled:opacity-60"
      >
        {status === 'loading' ? 'Sending…' : 'Send Message'}
      </button>

      {feedback && (
        <p
          className={`rounded-md px-4 py-3 text-sm ${
            status === 'error'
              ? 'bg-red-50 text-red-700'
              : 'bg-gold-50 text-gold-800'
          }`}
        >
          {feedback}
        </p>
      )}
    </form>
  );
}
