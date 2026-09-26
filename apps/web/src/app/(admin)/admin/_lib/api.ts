'use client';

import { siteConfig } from '@/lib/config';

export const API_URL = siteConfig.apiUrl;

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown,
  ) {
    super(message);
  }
}

export type AdminUser = { id: string; email: string; name: string; role: 'ADMIN' | 'EDITOR' };

export type Media = {
  id: string;
  filename: string;
  path: string;
  mimeType: string;
  kind: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  alt: string;
  width: number | null;
  height: number | null;
  sizeBytes: number;
  variants: {
    thumb?: { path: string; webp?: string };
    md?: { path: string; webp?: string };
    poster?: string;
  };
  createdAt: string;
};

let refreshing: Promise<boolean> | null = null;

/** One refresh at a time, shared by every request that hit a 401. */
function refreshSession() {
  refreshing ??= fetch(`${API_URL}/auth/refresh`, { method: 'POST', credentials: 'include' })
    .then((res) => res.ok)
    .catch(() => false)
    .finally(() => setTimeout(() => (refreshing = null), 0));
  return refreshing;
}

function toLogin() {
  const next = encodeURIComponent(window.location.pathname + window.location.search);
  window.location.href = `/admin/login?next=${next}`;
}

function errorMessage(data: unknown, status: number) {
  const msg = (data as { message?: string | string[] } | null)?.message;
  if (Array.isArray(msg)) return msg.join('\n');
  return msg || `Something went wrong (error ${status}). Please try again.`;
}

/** Endpoints where a 401 means "wrong credentials", not "session expired". */
const NO_REFRESH = new Set(['/auth/login', '/auth/refresh', '/auth/logout']);

/** Sends a request; on 401 renews the session once and retries. */
async function request(path: string, init: { method?: string; body?: unknown } = {}) {
  const send = () =>
    fetch(`${API_URL}${path}`, {
      method: init.method ?? 'GET',
      credentials: 'include',
      headers: init.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });

  const res = await send();
  if (res.status !== 401 || NO_REFRESH.has(path)) return res;
  if (await refreshSession()) return send();
  toLogin();
  throw new ApiError('Your session has expired. Please sign in again.', 401);
}

/** JSON request to the API with cookie auth and one silent session refresh. */
export async function api<T = unknown>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const res = await request(path, init);
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(errorMessage(data, res.status), res.status, data);
  return data as T;
}

/** Downloads a file from the API (with session refresh) and saves it. */
export async function download(path: string, filename: string) {
  const res = await request(path);
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new ApiError(errorMessage(data, res.status), res.status, data);
  }
  const url = URL.createObjectURL(await res.blob());
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Multipart upload with progress (videos can be large). */
export function uploadMedia(
  file: File,
  alt: string,
  onProgress?: (fraction: number) => void,
): Promise<Media> {
  const attempt = () =>
    new Promise<{ status: number; data: unknown }>((resolve, reject) => {
      const form = new FormData();
      form.append('file', file);
      if (alt) form.append('alt', alt);
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_URL}/admin/media`);
      xhr.withCredentials = true;
      xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(e.loaded / e.total);
      xhr.onload = () => {
        let data: unknown = null;
        try {
          data = JSON.parse(xhr.responseText);
        } catch {
          /* non-JSON error page */
        }
        resolve({ status: xhr.status, data });
      };
      xhr.onerror = () => reject(new ApiError('Upload failed — check your connection.', 0));
      xhr.send(form);
    });

  return (async () => {
    let result = await attempt();
    if (result.status === 401) {
      if (!(await refreshSession())) {
        toLogin();
        throw new ApiError('Your session has expired. Please sign in again.', 401);
      }
      result = await attempt();
    }
    if (result.status === 413) throw new ApiError('That file is too large.', 413);
    if (result.status >= 400) throw new ApiError(errorMessage(result.data, result.status), result.status, result.data);
    return result.data as Media;
  })();
}

/** Small preview URL for a media item (WebP thumbnail, video poster, or nothing). */
export function thumbPath(media: Pick<Media, 'kind' | 'path' | 'variants'>) {
  if (media.kind === 'IMAGE') return media.variants.thumb?.webp ?? media.variants.thumb?.path ?? media.path;
  if (media.kind === 'VIDEO') return media.variants.poster;
  return undefined;
}
