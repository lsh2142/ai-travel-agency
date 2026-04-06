import { NextResponse } from 'next/server'
import { getServerSession, createServerClient } from '@/lib/auth/supabase-auth'
import type { TripPlan } from '@/lib/types/travel'
import type { SelectedFlight } from '@/lib/types/flight-session'

export const runtime = 'nodejs'

interface SaveItineraryBody {
  plan: TripPlan
  selectedFlight?: SelectedFlight | null
}

export async function POST(req: Request) {
  const body = await req.json() as SaveItineraryBody
  const { plan, selectedFlight } = body

  if (!plan?.id || !plan.params?.destination) {
    return NextResponse.json({ error: 'plan.id and plan.params.destination required' }, { status: 400 })
  }

  const session = await getServerSession()

  // 미인증 시 저장 스킵 — 클라이언트는 이 응답을 받으면 조용히 넘어감
  if (!session) {
    return NextResponse.json({ saved: false, reason: 'unauthenticated' })
  }

  // ── 1. travel_plans 저장 ─────────────────────────────────────────────────
  const travelPlanPayload = {
    id: plan.id,
    user_id: session.user.id,
    destination: plan.params.destination || '미정',
    check_in: plan.params.dates?.start ?? '',
    check_out: plan.params.dates?.end ?? '',
    guests: plan.params.people ?? 1,
    plan_data: plan as unknown as Record<string, unknown>,
  }

  if (session) {
    const db = createServerClient(session.accessToken)
    const { error: tpError } = await db.from('travel_plans').upsert(travelPlanPayload)
    if (tpError) {
      console.error('[itinerary/save] travel_plans upsert error:', tpError.message)
      return NextResponse.json({ error: tpError.message }, { status: 500 })
    }
  }

  // ── 2. trip_itineraries + itinerary_items 저장 (인증된 사용자만) ─────────
  if (session) {
    const db = createServerClient(session.accessToken)

    // 2-a. trip_itineraries row upsert
    const itineraryPayload = {
      id: plan.id,
      user_id: session.user.id,
      title: `${plan.params.destination || '여행'} ${plan.params.dates?.start ?? ''} ~ ${plan.params.dates?.end ?? ''}`.trim(),
      start_date: plan.params.dates?.start ?? null,
      end_date: plan.params.dates?.end ?? null,
    }

    const { error: itError } = await db
      .from('trip_itineraries')
      .upsert(itineraryPayload, { onConflict: 'id' })

    if (itError) {
      // trip_itineraries 테이블이 아직 마이그레이션 안 됐을 수 있으므로 soft-fail
      console.warn('[itinerary/save] trip_itineraries upsert warn:', itError.message)
    } else {
      // 2-b. itinerary_items 저장 (항공편 + 숙박 항목)
      const items: Array<{
        itinerary_id: string
        type: string
        item_date: string | null
        title: string
        description: string | null
        booking_status: string
        booking_url: string | null
        price: number | null
        currency: string
        metadata: Record<string, unknown>
      }> = []

      // 항공편 아이템
      if (selectedFlight?.outbound) {
        items.push({
          itinerary_id: plan.id,
          type: 'flight',
          item_date: plan.params.dates?.start ?? null,
          title: `${selectedFlight.outbound.airline} ${selectedFlight.outbound.flightNumber} ICN→${selectedFlight.outbound.arrival.airport}`,
          description: `${selectedFlight.outbound.departure.time} 출발 · ${selectedFlight.outbound.stops === 0 ? '직항' : `${selectedFlight.outbound.stops}회 경유`} · ${selectedFlight.outbound.class === 'economy' ? '이코노미' : '비즈니스'}`,
          booking_status: 'planned',
          booking_url: selectedFlight.outbound.bookingUrl || null,
          price: selectedFlight.outbound.price ?? null,
          currency: 'KRW',
          metadata: { flightData: selectedFlight.outbound as unknown as Record<string, unknown> },
        })
      }

      // 숙박 아이템 (각 day의 accommodation 타입만)
      for (const day of plan.days) {
        for (const item of day.items) {
          if (item.type !== 'accommodation') continue
          const selectedAlt = item.selectedAlternativeId
            ? item.alternatives.find((a) => a.id === item.selectedAlternativeId)
            : item.alternatives[0]
          if (!selectedAlt) continue
          items.push({
            itinerary_id: plan.id,
            type: 'accommodation',
            item_date: day.date || null,
            title: selectedAlt.name,
            description: selectedAlt.description ?? null,
            booking_status: 'planned',
            booking_url: selectedAlt.bookingUrl && selectedAlt.bookingUrl !== '#'
              ? selectedAlt.bookingUrl
              : null,
            price: null,
            currency: 'KRW',
            metadata: {},
          })
        }
      }

      if (items.length > 0) {
        // 기존 아이템 삭제 후 재삽입 (upsert 대신)
        await db.from('itinerary_items').delete().eq('itinerary_id', plan.id)
        const { error: itemError } = await db.from('itinerary_items').insert(items)
        if (itemError) {
          console.warn('[itinerary/save] itinerary_items insert warn:', itemError.message)
        }
      }
    }
  }

  return NextResponse.json({ saved: true, id: plan.id })
}
