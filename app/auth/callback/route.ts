import { NextRequest, NextResponse } from 'next/server';

/**
 * Google OAuth 콜백 핸들러
 *
 * Supabase PKCE 플로우에서 code_verifier는 브라우저의 localStorage에 저장됩니다.
 * 서버 Route Handler에서 exchangeCodeForSession을 호출하면 code_verifier에 접근할 수 없어
 * PKCE 검증이 실패합니다.
 *
 * 따라서 code 쿼리 파라미터를 클라이언트 페이지로 전달하여
 * 브라우저의 Supabase 클라이언트(localStorage 접근 가능)가 처리하도록 합니다.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // OAuth 에러 응답 처리
  if (error) {
    const redirectUrl = new URL('/auth', origin);
    redirectUrl.searchParams.set('error', errorDescription ?? error);
    return NextResponse.redirect(redirectUrl);
  }

  // code가 있으면 클라이언트 페이지로 전달 (PKCE code_verifier는 브라우저에 있음)
  if (code) {
    const redirectUrl = new URL('/auth/callback-client', origin);
    redirectUrl.searchParams.set('code', code);
    return NextResponse.redirect(redirectUrl);
  }

  // code도 error도 없으면 로그인 페이지로
  return NextResponse.redirect(new URL('/auth', origin));
}
