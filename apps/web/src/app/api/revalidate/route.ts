import { revalidateTag } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';

const ALLOWED_TAGS = new Set([
  'services',
  'projects',
  'gallery',
  'clients',
  'team',
  'values',
  'why-us',
  'settings',
]);

/** Called by the API after content changes so pages refresh within seconds. */
export async function POST(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || req.headers.get('x-revalidate-secret') !== secret) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as { tags?: unknown } | null;
  const tags = Array.isArray(body?.tags)
    ? body.tags.filter((t): t is string => typeof t === 'string' && ALLOWED_TAGS.has(t))
    : [];
  tags.forEach((tag) => revalidateTag(tag));

  return NextResponse.json({ revalidated: tags });
}
