import { siteConfig } from './config';

/**
 * Origin that serves `/uploads`. Derived from the API URL: in development the
 * API serves uploads itself; in production nginx serves them on the same host.
 */
const MEDIA_ORIGIN = /^https?:\/\//.test(siteConfig.apiUrl)
  ? new URL(siteConfig.apiUrl).origin
  : '';

/** Absolute URL for a stored media path such as `/uploads/2026/09/x.jpg`. */
export function mediaUrl(path: string | undefined | null) {
  if (!path) return undefined;
  return path.startsWith('/uploads/') ? `${MEDIA_ORIGIN}${path}` : path;
}
