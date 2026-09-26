import { mediaUrl } from './media';

/**
 * next/image loader for CMS uploads. The API pre-generates WebP renditions
 * named `<name>-thumb|md|lg.webp` next to every image, so we pick the
 * smallest one that covers the requested width instead of resizing on the fly.
 * Anything that is not a CMS upload is served unchanged.
 */
export default function cmsImageLoader({ src, width }: { src: string; width: number }) {
  if (!src.startsWith('/uploads/')) return src;
  const size = width <= 480 ? 'thumb' : width <= 1280 ? 'md' : 'lg';
  const base = src.replace(/\.[a-z0-9]+$/i, '');
  return mediaUrl(`${base}-${size}.webp`)!;
}
