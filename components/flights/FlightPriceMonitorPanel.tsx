'use client'

import { useState, useEffect } from 'react'
import type { FlightPriceAlert } from '@/lib/flight-monitor/types'
import { FLIGHT_MONITOR_JOBS_KEY } from '@/lib/flight-monitor/types'

interface FlightPriceMonitorPanelProps {
  /** 현재 검색 중인 출발지 (IATA) */
  from?: string
  /** 현재 검색 중인 도착지 (IATA) */
  to?: string
  /** 출발 날짜 */
  departureDate?: string
  /** 귀국 날짜 */
  returnDate?: string
  /** 현재 최저가 (힌트용) */
  currentMinPrice?: number
}

type RegisterStatus = 'idle' | 'loading' | 'success' | 'error'
type CheckStatus = 'idle' | 'loading' | 'done'

export default function FlightPriceMonitorPanel({
  from = 'ICN',
  to = '',
  departureDate = '',
  returnDate = '',
  currentMinPrice,
}: FlightPriceMonitorPanelProps) {
  const [alerts, setAlerts] = useState<FlightPriceAlert[]>([])
  const [targetPrice, setTargetPrice] = useState<string>(
    currentMinPrice ? String(Math.round(currentMinPrice * 0.9)) : ''
  )
  const [telegramChatId, setTelegramChatId] = useState('')
  const [registerStatus, setRegisterStatus] = useState<RegisterStatus>('idle')
  const [checkStatus, setCheckStatus] = useState<CheckStatus>('idle')
  const [checkResult, setCheckResult] = useState<{ notified: number; checked: number } | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  // localStorage에서 알림 목록 불러오기
  useEffect(() => {
    try {
      const stored = localStorage.getItem(FLIGHT_MONITOR_JOBS_KEY)
      if (stored) setAlerts(JSON.parse(stored) as FlightPriceAlert[])
    } catch { /* 무시 */ }
  }, [])

  // currentMinPrice가 바뀌면 기본 targetPrice 갱신
  useEffect(() => {
    if (currentMinPrice && !targetPrice) {
      setTargetPrice(String(Math.round(currentMinPrice * 0.9)))
    }
  }, [currentMinPrice, targetPrice])

  async function handleRegister() {
    if (!to || !departureDate || !targetPrice || !telegramChatId) return
    setRegisterStatus('loading')
    try {
      const res = await fetch('/api/flight-monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from,
          to,
          departureDate,
          returnDate: returnDate || undefined,
          targetPrice: parseInt(targetPrice.replace(/,/g, '')),
          telegramChatId,
          bookingUrl: `https://www.google.com/flights#flt=${from}.${to}.${departureDate};c:KRW`,
        }),
      })

      if (!res.ok) {
        setRegisterStatus('error')
        return
      }

      const { alert } = await res.json() as { alert: FlightPriceAlert }
      const updated = [alert, ...alerts]
      setAlerts(updated)
      try { localStorage.setItem(FLIGHT_MONITOR_JOBS_KEY, JSON.stringify(updated)) } catch { /* 무시 */ }
      setRegisterStatus('success')
      setTelegramChatId('')
      setTimeout(() => setRegisterStatus('idle'), 3000)
    } catch {
      setRegisterStatus('error')
    }
  }

  async function handleCheck(alertId?: string) {
    setCheckStatus('loading')
    setCheckResult(null)
    try {
      const res = await fetch('/api/flight-monitor/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alertId ? { alertId } : {}),
      })
      const data = await res.json() as { checked: number; notified: number }
      setCheckResult({ checked: data.checked, notified: data.notified })
      setCheckStatus('done')
    } catch {
      setCheckStatus('idle')
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/flight-monitor?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    const updated = alerts.filter((a) => a.id !== id)
    setAlerts(updated)
    try { localStorage.setItem(FLIGHT_MONITOR_JOBS_KEY, JSON.stringify(updated)) } catch { /* 무시 */ }
  }

  const activeAlerts = alerts.filter((a) => a.status === 'active')

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
      {/* Header — toggle */}
      <button
        type="button"
        onClick={() => setIsExpanded((p) => !p)}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-zinc-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">🔔</span>
          <span className="text-sm font-semibold text-zinc-900">항공권 가격 알림 등록</span>
          {activeAlerts.length > 0 && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
              {activeAlerts.length}개 활성
            </span>
          )}
        </div>
        <span className="text-zinc-400 text-xs">{isExpanded ? '▲' : '▼'}</span>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-zinc-100 pt-4">
          {/* Registration form */}
          <div className="space-y-3">
            <p className="text-xs text-zinc-500">
              목표 가격 이하로 내려오면 Telegram으로 알림을 보내드립니다.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">🛫 노선</label>
                <div className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
                  {from || 'ICN'} → {to || '—'}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">📅 출발일</label>
                <div className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
                  {departureDate || '—'}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">
                💰 목표 가격 (KRW)
                {currentMinPrice && (
                  <span className="text-zinc-400 font-normal ml-1">
                    현재 최저가: ₩{currentMinPrice.toLocaleString('ko-KR')}
                  </span>
                )}
              </label>
              <input
                type="number"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder="예: 250000"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">
                💬 Telegram Chat ID
                <a
                  href="https://t.me/userinfobot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 text-blue-500 hover:underline"
                >
                  (ID 확인하기 →)
                </a>
              </label>
              <input
                type="text"
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value)}
                placeholder="예: 123456789"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="button"
              onClick={handleRegister}
              disabled={!to || !departureDate || !targetPrice || !telegramChatId || registerStatus === 'loading'}
              className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                registerStatus === 'success'
                  ? 'bg-emerald-600 text-white'
                  : registerStatus === 'error'
                  ? 'bg-red-100 text-red-700 border border-red-300'
                  : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {registerStatus === 'loading' ? '등록 중...'
                : registerStatus === 'success' ? '✅ 등록 완료!'
                : registerStatus === 'error' ? '❌ 등록 실패 — 다시 시도'
                : '🔔 가격 알림 등록'}
            </button>
          </div>

          {/* Active alerts list */}
          {activeAlerts.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-zinc-700">활성 알림 ({activeAlerts.length})</p>
                <button
                  type="button"
                  onClick={() => handleCheck()}
                  disabled={checkStatus === 'loading'}
                  className="text-xs text-blue-600 hover:underline disabled:opacity-50"
                >
                  {checkStatus === 'loading' ? '확인 중...' : '지금 확인하기'}
                </button>
              </div>

              {checkResult && (
                <p className="text-xs text-emerald-600">
                  ✅ {checkResult.checked}개 확인 완료 — {checkResult.notified > 0
                    ? `${checkResult.notified}개 알림 발송됨`
                    : '아직 목표 가격 이하 없음'}
                </p>
              )}

              {activeAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between bg-zinc-50 rounded-lg px-3 py-2.5 border border-zinc-200"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-zinc-900">{alert.route}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {alert.departureDate} · 목표 ₩{alert.targetPrice.toLocaleString('ko-KR')}
                      {alert.currentPrice
                        ? ` · 현재 ₩${alert.currentPrice.toLocaleString('ko-KR')}`
                        : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(alert.id)}
                    className="ml-2 text-xs text-zinc-400 hover:text-red-500 transition-colors flex-none"
                    aria-label="알림 삭제"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
