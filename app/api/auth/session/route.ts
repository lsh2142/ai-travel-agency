import { NextRequest, NextResponse } from 'next/server';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '@/lib/auth/supabase-auth';

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

export async function POST(request: NextRequest) {
  const body = await request.json() as { accessToken?: string; refreshToken?: string };
  if (!body.accessToken) {
    return NextResponse.json({ error: 'accessToken required' }, { status: 400 });
  }
  const response = NextResponse.json({ success: true });
  response.cookies.set(ACCESS_TOKEN_COOKIE, body.accessToken, COOKIE_OPTS);
  if (body.refreshToken) {
    response.cookies.set(REFRESH_TOKEN_COOKIE, body.refreshToken, COOKIE_OPTS);
  }
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(ACCESS_TOKEN_COOKIE);
  response.cookies.delete(REFRESH_TOKEN_COOKIE);
  return response;
}
