import type { MediaKind } from '@prisma/client';

export type DetectedType = { mime: string; ext: string; kind: MediaKind };

/** A recognised file that we deliberately refuse, with advice for the editor. */
export class UnsupportedFileError extends Error {}

/** ISO-BMFF "major brands" that browsers play as MP4. */
const MP4_BRANDS = new Set([
  'isom', 'iso2', 'iso3', 'iso4', 'iso5', 'iso6', 'iso7', 'iso8', 'iso9',
  'mp41', 'mp42', 'mp71', 'avc1', 'M4V ', 'dash', 'mmp4', 'msnv', 'MSNV',
]);
const HEIF_BRANDS = new Set(['heic', 'heix', 'heim', 'heis', 'hevc', 'hevx', 'mif1', 'msf1', 'avif', 'avis']);

/**
 * Identifies an upload from its first bytes rather than trusting the file name
 * or the browser-supplied mime type. Returns null for anything not on the
 * allow-list (SVG and other script-capable formats are deliberately excluded),
 * and throws UnsupportedFileError for common formats that need converting first.
 */
export function detectFileType(head: Buffer): DetectedType | null {
  const ascii = (start: number, end: number) =>
    head.subarray(start, end).toString('latin1');

  if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) {
    return { mime: 'image/jpeg', ext: 'jpg', kind: 'IMAGE' };
  }
  if (head.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { mime: 'image/png', ext: 'png', kind: 'IMAGE' };
  }
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') {
    return { mime: 'image/webp', ext: 'webp', kind: 'IMAGE' };
  }
  if (ascii(4, 8) === 'ftyp') {
    const brand = ascii(8, 12);
    if (MP4_BRANDS.has(brand)) return { mime: 'video/mp4', ext: 'mp4', kind: 'VIDEO' };
    if (HEIF_BRANDS.has(brand)) {
      throw new UnsupportedFileError(
        'iPhone HEIC/AVIF photos are not supported. Export the photo as JPG (on iPhone: Settings → Camera → Formats → Most Compatible) and upload again.',
      );
    }
    if (brand === 'qt  ') {
      throw new UnsupportedFileError('QuickTime (.mov) videos are not supported. Convert the video to MP4 and upload again.');
    }
    return null;
  }
  if (head.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))) {
    return { mime: 'video/webm', ext: 'webm', kind: 'VIDEO' };
  }
  if (ascii(0, 5) === '%PDF-') {
    return { mime: 'application/pdf', ext: 'pdf', kind: 'DOCUMENT' };
  }
  return null;
}

export const MAX_BYTES: Record<MediaKind, number> = {
  IMAGE: 15 * 1024 * 1024,
  VIDEO: 200 * 1024 * 1024,
  DOCUMENT: 20 * 1024 * 1024,
};
