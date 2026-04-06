'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MONITOR_JOBS_KEY, type MonitorJob } from '@/lib/monitor/types'
import { FLIGHT_MONITOR_JOBS_KEY, type FlightPriceAlert } from '@/lib/flight-monitor/types'
import { supabase } from '@/lib/db/supabase'

type Tab = 'accommodation' | 'flight'

export default function MonitorsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('accommodation')
  const [jobs, setJobs] = useState<MonitorJob[]>([])
  const [flightAlerts, setFlightAlerts] = useState<FlightPriceAlert[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [checkStatus, setCheckStatus] = useState<'idle' | 'loading' | 'done'>('idle')
  const [checkResult, setCheckResult] = useState<{ checked: number; notified: number } | null>(null)

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut()
    await fetch('/api/auth/session', { method: 'DELETE' })
    router.push('/auth')
  }, [router])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(MONITOR_JOBS_KEY)
      if (stored) setJobs(JSON.parse(stored) as MonitorJob[])
    } catch { /* 무시 */ }

    try {
      const stored = localStorage.getItem(FLIGHT_MONITOR_JOBS_KEY)
      if (stored) setFlightAlerts(JSON.parse(stored) as FlightPriceAlert[])
    } catch { /* 무시 */ }
  }, [])

  const handleDeleteAccommodation = useCallback(async (jobId: string) => {
    setDeletingId(jobId)
    try {
      await fetch(`/api/monitor?jobId=${encodeURIComponent(jobId)}`, { method: 'DELETE' })
    } catch { /* silent */ }
    const updated = jobs.filter((j) => j.jobId !== jobId)
    setJobs(updated)
    try { localStorage.setItem(MONITOR_JOBS_KEY, JSON.stringify(updated)) } catch { /* 무시 */ }
    setDeletingId(null)
  }, [jobs])

  const handleDeleteFlight = useCallback(async (id: string) => {
    setDeletingId(id)
    try {
      await fetch(`/api/flight-monitor?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    } catch { /* silent */ }
    const updated = flightAlerts.filter((a) => a.id !== id)
    setFlightAlerts(updated)
    try { localStorage.setItem(FLIGHT_MONITOR_JOBS_KEY, JSON.stringify(updated)) } catch { /* 무시 */ }
    setDeletingId(null)
  }, [flightAlerts])

  const handleCheckAll = useCallback(async () => {
    setCheckStatus('loading')
    setCheckResult(null)
    try {
      const res = await fetch('/api/flight-monitor/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json() as { checked: number; notified: number }
      setCheckResult({ checked: data.checked, notified: data.notified })
      setCheckStatus('done')
    } catch {
      setCheckStatus('idle')
    }
  }, [])

  const totalCount = jobs.length + flightAlerts.filter((a) => a.status === 'active').length

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50">
      {/* Legacy header — kept for compatibility */}
      <header className="bg-white border-b shadow-sm">
        <div className="px-6 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">AI 여행 플래닝 에이전트</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-400">{totalCount}개 모니터링 중</span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-400 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1 transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>
        <nav className="flex px-6 gap-1 border-t border-gray-100">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm text-gray-500 hover:text-gray-800 border-b-2 border-transparent hover:border-gray-300 transition-colors"
          >
            💬 채팅
          </Link>
          <Link
            href="/itinerary"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm text-gray-500 hover:text-gray-800 border-b-2 border-transparent hover:border-gray-300 transition-colors"
          >
            🗓 일정
          </Link>
          <span className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-blue-600 border-b-2 border-blue-500">
            🔔 모니터링
          </span>
        </nav>
      </header>

      <main className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full space-y-4">
        {/* Tab selector */}
        <div className="flex bg-zinc-100 rounded-xl p-1 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('accommodation')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'accommodation'
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            🏨 숙박 ({jobs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('flight')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'flight'
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            ✈️ 항공권 ({flightAlerts.filter((a) => a.status === 'active').length})
          </button>
        </div>

        {/* Accommodation Tab */}
        {activeTab === 'accommodation' && (
          <>
            {jobs.length === 0 ? (
              <div className="text-center mt-16">
                <p className="text-4xl mb-4">🏨</p>
                <p className="text-lg font-medium text-zinc-600 mb-2">등록된 숙박 모니터링이 없어요</p>
                <p className="text-sm text-zinc-400 mb-6">예약 페이지에서 빈방 모니터링을 등록해보세요</p>
                <Link
                  href="/booking"
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-600 transition-colors"
                >
                  예약 페이지로 →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {jobs.map((job) => (
                  <div
                    key={job.jobId}
                    className="bg-white rounded-2xl border border-zinc-200 shadow-sm px-5 py-4 flex items-start justify-between gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-base font-semibold text-zinc-800 truncate">{job.accommodationName}</span>
                        <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs text-emerald-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                          모니터링 중
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-zinc-500">
                        <span>📅 체크인: <span className="text-zinc-700">{job.checkIn}</span></span>
                        <span>📅 체크아웃: <span className="text-zinc-700">{job.checkOut}</span></span>
                        <span>👥 인원: <span className="text-zinc-700">{job.guests}명</span></span>
                        <span>🕐 등록: <span className="text-zinc-700">{new Date(job.registeredAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></span>
                      </div>
                      {job.url && job.url !== 'https://www.jalan.net/' && (
                        <a
                          href={job.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 block text-xs text-blue-500 hover:underline truncate"
                        >
                          🔗 {job.url}
                        </a>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteAccommodation(job.jobId)}
                      disabled={deletingId === job.jobId}
                      className="shrink-0 text-xs text-zinc-400 hover:text-red-500 border border-zinc-200 hover:border-red-300 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-40"
                    >
                      {deletingId === job.jobId ? '삭제 중...' : '삭제'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Flight Tab */}
        {activeTab === 'flight' && (
          <>
            {flightAlerts.length === 0 ? (
              <div className="text-center mt-16">
                <p className="text-4xl mb-4">✈️</p>
                <p className="text-lg font-medium text-zinc-600 mb-2">등록된 항공권 알림이 없어요</p>
                <p className="text-sm text-zinc-400 mb-6">항공권 검색 페이지에서 가격 알림을 등록해보세요</p>
                <Link
                  href="/plan/flights"
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-600 transition-colors"
                >
                  ✈️ 항공권 검색으로 →
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-zinc-700">
                    {flightAlerts.filter((a) => a.status === 'active').length}개 알림 활성
                  </p>
                  <button
                    type="button"
                    onClick={handleCheckAll}
                    disabled={checkStatus === 'loading'}
                    className="text-sm text-blue-600 hover:underline disabled:opacity-50"
                  >
                    {checkStatus === 'loading' ? '확인 중...' : '지금 전체 확인'}
                  </button>
                </div>

                {checkResult && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700">
                    ✅ {checkResult.checked}개 확인 완료 —{' '}
                    {checkResult.notified > 0
                      ? `${checkResult.notified}개 Telegram 알림 발송됨`
                      : '아직 목표 가격 이하 항공편 없음'}
                  </div>
                )}

                <div className="space-y-3">
                  {flightAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`bg-white rounded-2xl border shadow-sm px-5 py-4 ${
                        alert.status === 'triggered'
                          ? 'border-emerald-300 bg-emerald-50'
                          : 'border-zinc-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-base font-semibold text-zinc-800">{alert.route}</span>
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                              alert.status === 'triggered'
                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                : alert.status === 'expired'
                                ? 'bg-zinc-100 text-zinc-500 border border-zinc-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}>
                              {alert.status === 'triggered'
                                ? <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> 알림 발송됨</>
                                : alert.status === 'expired'
                                ? '만료됨'
                                : <><span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse inline-block" /> 모니터링 중</>
                              }
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-zinc-500">
                            <span>📅 출발일: <span className="text-zinc-700">{alert.departureDate}</span></span>
                            {alert.returnDate && (
                              <span>📅 귀국일: <span className="text-zinc-700">{alert.returnDate}</span></span>
                            )}
                            <span>🎯 목표 가격: <span className="text-zinc-700 font-medium">₩{alert.targetPrice.toLocaleString('ko-KR')}</span></span>
                            {alert.currentPrice ? (
                              <span>💰 현재가: <span className={`font-medium ${alert.currentPrice <= alert.targetPrice ? 'text-emerald-600' : 'text-zinc-700'}`}>
                                ₩{alert.currentPrice.toLocaleString('ko-KR')}
                              </span></span>
                            ) : null}
                            <span>🕐 등록: <span className="text-zinc-700">{new Date(alert.registeredAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</span></span>
                            {alert.lastCheckedAt && (
                              <span>🔍 마지막 확인: <span className="text-zinc-700">{new Date(alert.lastCheckedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span></span>
                            )}
                          </div>

                          {alert.bookingUrl && (
                            <a
                              href={alert.bookingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 block text-xs text-blue-500 hover:underline"
                            >
                              🔗 Google Flights에서 확인 →
                            </a>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteFlight(alert.id)}
                          disabled={deletingId === alert.id}
                          className="shrink-0 text-xs text-zinc-400 hover:text-red-500 border border-zinc-200 hover:border-red-300 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-40"
                        >
                          {deletingId === alert.id ? '삭제 중...' : '삭제'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
