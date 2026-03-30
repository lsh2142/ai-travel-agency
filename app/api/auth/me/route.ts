import { getServerSession } from '@/lib/auth/supabase-auth'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ user: null })
  }
  return NextResponse.json({
    user: { id: session.user.id, email: session.user.email },
  })
}
