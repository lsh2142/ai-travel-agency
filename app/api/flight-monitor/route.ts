import { NextRequest, NextResponse } from 'next/server'
import { flightMonitorStore } from '@/lib/flight-monitor/store'
import type { FlightPriceAlert } from '@/lib/flight-monitor/types'

export const runtime = 'nodejs'

// GET — 등록된 항공편 가격 알림 목록 조회
export async function GET() {
  const alerts = Array.from(flightMonitorStore.values())
    .sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime())
  return NextResponse.json({ alerts })
}

// POST — 항공편 가격 알림 등록
export async function POST(request: NextRequest) {
  let body: {
    from: string
    to: string
    departureDate: string
    returnDate?: string
    targetPrice: number
    telegramChatId: string
    bookingUrl?: string
  }

  try {
    body = await request.json() as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { from, to, departureDate, targetPrice, telegramChatId } = body
  if (!from || !to || !departureDate || !targetPrice || !telegramChatId) {
    return NextResponse.json(
      { error: 'from, to, departureDate, targetPrice, telegramChatId 필드가 필요합니다' },
      { status: 400 }
    )
  }

  // Telegram chatId 유효성 검증 (TELEGRAM_BOT_TOKEN이 설정된 경우에만)
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (botToken) {
    try {
      const chatRes = await fetch(
        `https://api.telegram.org/bot${botToken}/getChat?chat_id=${encodeURIComponent(telegramChatId)}`
      )
      const chatData = await chatRes.json() as { ok: boolean; description?: string }
      if (!chatData.ok) {
        return NextResponse.json(
          { error: `유효하지 않은 Telegram chatId: ${chatData.description ?? 'chat not found'}` },
          { status: 400 }
        )
      }
    } catch {
      // 네트워크 오류 시 검증 건너뜀 (등록은 허용)
    }
  }

  const route = `${from}-${to}`
  const bookingUrl = body.bookingUrl ||
    `https://www.google.com/flights#flt=${from}.${to}.${departureDate};c:KRW`

  const alert: FlightPriceAlert = {
    id: crypto.randomUUID(),
    route,
    from,
    to,
    departureDate,
    returnDate: body.returnDate,
    targetPrice,
    telegramChatId,
    status: 'active',
    registeredAt: new Date().toISOString(),
    bookingUrl,
  }

  flightMonitorStore.set(alert.id, alert)
  return NextResponse.json({ alert }, { status: 201 })
}

// DELETE — 알림 삭제
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id 파라미터가 필요합니다' }, { status: 400 })

  const existed = flightMonitorStore.delete(id)
  if (!existed) return NextResponse.json({ error: '알림을 찾을 수 없습니다' }, { status: 404 })

  return NextResponse.json({ ok: true })
}
