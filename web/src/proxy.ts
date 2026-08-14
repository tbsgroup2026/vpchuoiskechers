import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';

const PUBLIC_ROUTES = ['/', '/about', '/careers', '/contact', '/login', '/mobile-guide', '/news'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow public website pages & static assets
  if (
    PUBLIC_ROUTES.includes(pathname) ||
    pathname.startsWith('/careers') ||
    pathname.startsWith('/news') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/public') ||
    pathname.startsWith('/api/auth/login') ||
    pathname.startsWith('/api/ops-departments') ||
    pathname.startsWith('/api/directories') ||
    pathname.startsWith('/api/meeting-bookings/availability') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 2. Check Auth Cookie or Authorization Header
  const authHeader = request.headers.get('Authorization');
  let token = authHeader ? authHeader.replace('Bearer ', '') : null;

  if (!token) {
    token = request.cookies.get('tbs_token')?.value || null;
  }

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 3. Verify JWT Payload
  const user = await verifyToken(token);
  if (!user) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 4. Role Protection for Admin Routes
  if (pathname.startsWith('/admin') && user.roleLevel > 1) {
    return NextResponse.redirect(new URL('/work', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
