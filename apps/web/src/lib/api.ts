import { siteConfig } from './config';

export type ContactPayload = {
  name: string;
  email: string;
  phone?: string;
  service?: string;
  subject?: string;
  message: string;
  /** Honeypot; must stay empty. */
  website?: string;
};

type ApiResult = { success: boolean; message: string };

async function postJson(path: string, body: unknown): Promise<ApiResult> {
  const res = await fetch(`${siteConfig.apiUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = (await res.json().catch(() => null)) as
    | (ApiResult & { message?: string | string[] })
    | null;

  if (!res.ok) {
    const detail = data?.message;
    const msg = Array.isArray(detail) ? detail.join(', ') : detail;
    throw new Error(msg || 'Something went wrong. Please try again.');
  }

  return {
    success: true,
    message: data?.message?.toString() ?? 'Success',
  };
}

export const sendContactMessage = (payload: ContactPayload) =>
  postJson('/contact', payload);

export const subscribeNewsletter = (email: string) =>
  postJson('/newsletter/subscribe', { email });
