import { NextResponse, type NextRequest } from 'next/server';

/**
 * Sends visitors without a session cookie to the admin login page. This is
 * only a convenience redirect — the API checks every request itself.
 */
export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (pathname === '/admin/login') return NextResponse.next();

  if (!req.cookies.has('sis_rt') && !req.cookies.has('sis_at')) {
    const url = req.nextUrl.clone();
    url.pathname = '/admin/login';
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ['/admin', '/admin/:path*'] };
