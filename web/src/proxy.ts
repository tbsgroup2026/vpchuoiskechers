import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';
import { SYSTEM_USERS } from './lib/userProfiles';

const PUBLIC_ROUTES = ['/', '/about', '/careers', '/contact', '/login', '/mobile-guide', '/news'];

/**
 * Public routes that do NOT require authentication
 * This list takes precedence over path-based auth requirements
 */
const PUBLIC_PATHS = [
  '/work/kaizen/register', // Public kaizen registration (open form, no login needed)
  '/api/ci-kaizen',        // Kaizen API (handles its own authorization, rate limits & X-User-Emp-Code)
  '/api/users',            // User management & lookup API
  '/api/employees',        // Employee lookup API
  '/api/push',             // Push subscription API
  '/api/notifications',    // Notification API
];

/**
 * Routes that REQUIRE authentication with redirect on failure
 * Format: { path: string pattern, redirect?: boolean (default true for UI routes) }
 */
const PROTECTED_PATHS = [
  { path: '/work/kaizen', redirect: true }, // Protect /work/kaizen & all sub-routes
  { path: '/maintenance', redirect: true }, // Protect /maintenance & all sub-routes
];

/**
 * Check if a given pathname matches a protected path pattern
 */
function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some(({ path }) => {
    // Exact match or prefix match (with / boundary)
    return pathname === path || pathname.startsWith(path + '/');
  });
}

/**
 * Check if a given pathname is explicitly public (exception to protected paths)
 */
function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(publicPath => {
    // Exact match or prefix match (with / boundary)
    return pathname === publicPath || pathname.startsWith(publicPath + '/');
  });
}

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
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 2. Check if this path is explicitly public (e.g., /work/kaizen/register, /api/users)
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // 3. Check Auth Cookie or Authorization Header
  const authHeader = request.headers.get('Authorization');
  let token = authHeader ? authHeader.replace('Bearer ', '') : null;

  if (!token) {
    token = request.cookies.get('tbs_token')?.value || null;
  }

  // 4. Handle missing token for protected paths
  if (!token) {
    // Protected path requires auth
    if (isProtectedPath(pathname)) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized', message: 'Authentication required' }, { status: 401 });
      }
      // Redirect to login with redirect_uri param for post-login navigation
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect_uri', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Generic unprotected route without token
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 5. Verify JWT Payload or Session Token Format
  let user = await verifyToken(token);
  if (!user && (token.startsWith('tbs_token_') || token.includes('tbs_token'))) {
    const match = token.match(/tbs_token_([^_]+)_/);
    if (match && match[1]) {
      const empCode = match[1];
      const sysUser = SYSTEM_USERS[empCode];
      user = {
        userId: sysUser?.userId || 888,
        empCode: empCode,
        name: sysUser?.name || `Cán Bộ Nhân Viên (${empCode})`,
        roleId: sysUser?.roleLevel || 4,
        roleCode: sysUser?.roleCode || 'CBCNV',
        roleLevel: sysUser?.roleLevel || 4,
        departmentId: 1,
        departmentCode: sysUser?.managedDepartmentId || sysUser?.departmentCode || 'TBS',
      };
    }
  }

  if (!user) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }
    // Redirect to login with redirect_uri for protected paths
    if (isProtectedPath(pathname)) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect_uri', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 6. Role Protection for Admin Routes
  if (pathname.startsWith('/admin') && user.roleLevel > 1) {
    return NextResponse.redirect(new URL('/work', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
