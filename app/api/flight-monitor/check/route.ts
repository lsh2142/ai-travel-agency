/**
 * GET|POST /api/flight-monitor/check
 * 등록된 모든 활성 항공편 가격 알림을 일괄 확인하고 Telegram 알림을 발송합니다.
 * GET: Vercel Cron Job 호출용 / POST: 수동 또는 특정 alertId 지정 호출
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAlerts, updateAlert } from '@/lib/flight-monitor/store'
import { checkFlightAlert } from '@/lib/flight-monitor/checker'

export const runtime = 'nodejs'

async function runCheck(alertId?: string) {
  const now = new Date().toISOString()
  const all = await getAlerts(alertId)
  const alerts = all.filter((a) => a.status === 'active')

  if (alerts.length === 0) {
    return NextResponse.json({ message: '확인할 활성 알림이 없습니다', results: [] })
  }

  const results = await Promise.all(alerts.map((alert) => checkFlightAlert(alert)))

  // 스토어 업데이트 (가격 + 상태 갱신)
  await Promise.all(
    results.map((res, idx) => {
      const alert = alerts[idx]
      return updateAlert(alert.id, {
        currentPrice: res.currentPrice,
        lastCheckedAt: now,
        ...(res.triggered && res.notified
          ? { status: 'triggered' as const, triggeredAt: now }
          : {}),
      })
    })
  )

  const triggered = results.filter((r) => r.triggered)
  const notified = results.filter((r) => r.notified)

  return NextResponse.json({
    checked: results.length,
    triggered: triggered.length,
    notified: notified.length,
    results,
  })
}

// GET — Vercel Cron Job 호환
export async function GET() {
  return runCheck()
}

export async function POST(request: NextRequest) {
  let body: { alertId?: string } = {}
  try { body = await request.json() as { alertId?: string } } catch { /* 빈 body 허용 */ }
  return runCheck(body.alertId)
}
