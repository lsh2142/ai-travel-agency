import { NextRequest, NextResponse } from 'next/server';
import { ACCESS_TOKEN_COOKIE } from '@/lib/auth/supabase-auth';

// 로그인이 필수인 경로 목록 (prefix 매칭)
const PROTECTED_PREFIXES = ['/trips', '/booking', '/monitors'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;

  // 이미 로그인된 사용자가 /auth 접근 → 홈으로
  if (pathname.startsWith('/auth') && accessToken) {
    return NextResponse.redirect(new URL('/', request.nextUrl));
  }

  // 보호된 경로에 미인증 접근 → /auth로
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (isProtected && !accessToken) {
    const loginUrl = new URL('/auth', request.nextUrl);
    loginUrl.searchParams.set('next', pathname); // 로그인 후 원래 경로로 복귀
    return NextResponse.redirect(loginUrl);
  }

  // /, /plan, /plan/confirm 등은 비로그인도 접근 허용
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon\\.ico).*)'],
};
