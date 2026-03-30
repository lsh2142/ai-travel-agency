import { getServerSession, createServerClient } from '@/lib/auth/supabase-auth'
import { NextResponse } from 'next/server'
import type { TripPlan } from '@/lib/types/travel'

export async function GET() {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json([])
  }

  const db = createServerClient(session.accessToken)
  const { data, error } = await db
    .from('travel_plans')
    .select('id, destination, check_in, check_out, guests, plan_data, created_at')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    return NextResponse.json([])
  }

  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json() as {
    id: string
    destination: string
    check_in: string | null
    check_out: string | null
    guests: number
    plan_data: TripPlan
  }

  const db = createServerClient(session.accessToken)
  const { error } = await db.from('travel_plans').upsert({
    id: body.id,
    user_id: session.user.id,
    destination: body.destination || '미정',
    check_in: body.check_in ?? '',
    check_out: body.check_out ?? '',
    guests: body.guests ?? 1,
    plan_data: body.plan_data as unknown as Record<string, unknown>,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
