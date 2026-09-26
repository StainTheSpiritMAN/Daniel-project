import type { MediaKind } from '@prisma/client';

export type DetectedType = { mime: string; ext: string; kind: MediaKind };

/**
 * Identifies an upload from its first bytes rather than trusting the file name
 * or the browser-supplied mime type. Returns null for anything not on the
 * allow-list (SVG and other script-capable formats are deliberately excluded).
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
    return { mime: 'video/mp4', ext: 'mp4', kind: 'VIDEO' };
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
