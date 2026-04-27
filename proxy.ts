import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, isAuthenticated } from '@/lib/auth';

function isPublicPath(pathname: string): boolean {
  return pathname === '/login' || pathname.startsWith('/api/auth/login');
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (isAuthenticated(sessionCookie)) {
    return NextResponse.next();
  }

  const loginUrl = new URL('/login', request.url);
  const nextPath = pathname === '/' ? '/' : `${pathname}${search}`;
  loginUrl.searchParams.set('next', nextPath);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
