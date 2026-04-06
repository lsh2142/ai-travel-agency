/**
 * POST /api/flight-monitor/check
 * 등록된 모든 활성 항공편 가격 알림을 일괄 확인하고 Telegram 알림을 발송합니다.
 * Vercel Cron Job 또는 수동 호출로 사용합니다.
 */
import { NextRequest, NextResponse } from 'next/server'
import { flightMonitorStore } from '@/lib/flight-monitor/store'
import { checkFlightAlert } from '@/lib/flight-monitor/checker'
import type { FlightPriceAlert } from '@/lib/flight-monitor/types'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  // 특정 alertId를 지정하면 해당 항목만 확인 (선택)
  let body: { alertId?: string } = {}
  try { body = await request.json() as { alertId?: string } } catch { /* 빈 body 허용 */ }

  const now = new Date().toISOString()
  const alerts = Array.from(flightMonitorStore.values()).filter(
    (a) => a.status === 'active' && (!body.alertId || a.id === body.alertId)
  )

  if (alerts.length === 0) {
    return NextResponse.json({ message: '확인할 활성 알림이 없습니다', results: [] })
  }

  const results = await Promise.all(alerts.map((alert) => checkFlightAlert(alert)))

  // 스토어 업데이트 (가격 + 상태 갱신)
  results.forEach((res, idx) => {
    const alert = alerts[idx]
    const updated: FlightPriceAlert = {
      ...alert,
      currentPrice: res.currentPrice,
      lastCheckedAt: now,
      ...(res.triggered && res.notified
        ? { status: 'triggered' as const, triggeredAt: now }
        : {}),
    }
    flightMonitorStore.set(alert.id, updated)
  })

  const triggered = results.filter((r) => r.triggered)
  const notified = results.filter((r) => r.notified)

  return NextResponse.json({
    checked: results.length,
    triggered: triggered.length,
    notified: notified.length,
    results,
  })
}
