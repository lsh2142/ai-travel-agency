import { getServerSession, ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '@/lib/auth/supabase-auth'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await getServerSession()
  if (!session) {
    // Clear stale auth cookies so proxy.ts won't misidentify the user as authenticated
    const response = NextResponse.json({ user: null })
    response.cookies.delete(ACCESS_TOKEN_COOKIE)
    response.cookies.delete(REFRESH_TOKEN_COOKIE)
    return response
  }
  return NextResponse.json({
    user: { id: session.user.id, email: session.user.email },
  })
}
