import { NextRequest, NextResponse } from 'next/server';
import { ACCESS_TOKEN_COOKIE } from '@/lib/auth/supabase-auth';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;

  // Already authenticated → redirect away from /auth
  if (pathname.startsWith('/auth') && accessToken) {
    return NextResponse.redirect(new URL('/', request.nextUrl));
  }

  // Not authenticated → redirect to /auth
  if (!pathname.startsWith('/auth') && !accessToken) {
    return NextResponse.redirect(new URL('/auth', request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon\\.ico).*)'],
};
