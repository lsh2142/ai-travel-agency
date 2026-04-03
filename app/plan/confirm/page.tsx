'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { TripPlan } from '@/lib/types/travel'

function BookingStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    booked: { label: '✅ 예약완료', cls: 'bg-emerald-100 text-emerald-700' },
    pending: { label: '⏳ 예약 필요', cls: 'bg-amber-100 text-amber-700' },
    monitoring: { label: '🔔 모니터링 중', cls: 'bg-blue-100 text-blue-700' },
    manual_required: { label: '🔗 직접 예약', cls: 'bg-orange-100 text-orange-700' },
    skipped: { label: '— 건너뜀', cls: 'bg-zinc-100 text-zinc-500' },
  }
  const { label, cls } = map[status] ?? map.pending
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {label}
    </span>
  )
}

function extractPriceNumber(priceStr: string): number {
  const cleaned = priceStr.replace(/,/g, '').replace(/\s/g, '')
  // 1순위: 통화 기호(₩·¥·$·€) 바로 뒤 숫자 — "1박 ₩85,000~" → 85000
  const currencyMatch = cleaned.match(/[₩¥$€](\d+)/)
  if (currencyMatch) return parseInt(currencyMatch[1])
  // 2순위: 문자열 내 가장 큰 숫자 — "85000" → 85000, "1박" 같은 작은 숫자 무시
  const allNumbers = cleaned.match(/\d+/g)
  if (!allNumbers || allNumbers.length === 0) return 0
  return Math.max(...allNumbers.map((n) => parseInt(n)))
}

export default function PlanConfirmPage() {
  const router = useRouter()
  const [plan, setPlan] = useState<TripPlan | null>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem('tripPlan')
    if (!stored) {
      router.replace('/plan')
      return
    }
    setPlan(JSON.parse(stored) as TripPlan)
  }, [router])

  function handleStartBooking() {
    router.push('/booking')
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <p className="text-sm text-zinc-500">일정을 불러오는 중...</p>
      </div>
    )
  }

  const { params, days, bookingItems } = plan
  const startDate = params.dates?.start ?? days[0]?.date ?? ''
  const endDate = params.dates?.end ?? days[days.length - 1]?.date ?? ''

  let totalBudget = 0
  days.forEach((day) => {
    day.items.forEach((item) => {
      const alt = item.selectedAlternativeId
        ? item.alternatives.find((a) => a.id === item.selectedAlternativeId)
        : item.alternatives[0]
      if (alt?.price) totalBudget += extractPriceNumber(alt.price)
    })
  })

  return (
    <div className="min-h-screen bg-zinc-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button onClick={() => router.back()} className="text-sm text-zinc-500 hover:text-zinc-800">
            ← 이전으로
          </button>
          <h1 className="text-base font-semibold text-zinc-900">최종 일정 확인</h1>
          <span />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Trip Overview */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-5">
          <h2 className="text-xl font-bold text-zinc-900 mb-1">
            {params.destination || '여행'} 일정
          </h2>
          <div className="flex flex-wrap gap-3 text-sm text-zinc-600 mt-2">
            {startDate && endDate && (
              <span>📅 {startDate} ~ {endDate}</span>
            )}
            <span>👥 {params.people}명</span>
            {params.themes.length > 0 && (
              <span>🎯 {params.themes.join(', ')}</span>
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-2">{days.length}일 여행</p>
          {totalBudget > 0 && (
            <p className="text-sm font-semibold text-blue-600 mt-2">
              💰 총 예산: ₩{totalBudget.toLocaleString('ko-KR')} <span className="text-xs font-normal text-zinc-400">(대안 기준 합산)</span>
            </p>
          )}
        </div>

        {/* Itinerary Timeline */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-zinc-900">전체 일정</h3>
          {days.map((day) => (
            <div key={day.dayNumber} className="bg-white rounded-xl border border-zinc-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="flex-none w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  {day.dayNumber}
                </span>
                <div>
                  <p className="text-sm font-semibold text-zinc-900">{day.title}</p>
                  <p className="text-xs text-zinc-500">{day.date}</p>
                </div>
              </div>
              <div className="space-y-2 pl-9">
                {day.items.map((item, idx) => {
                  const selectedAlt = item.selectedAlternativeId
                    ? item.alternatives.find((a) => a.id === item.selectedAlternativeId)
                    : null
                  const displayAlt = selectedAlt ?? item.alternatives[0] ?? null
                  return (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-xs text-zinc-400 w-10 flex-none">{item.time}</span>
                      <div className="flex-1">
                        <p className="text-sm text-zinc-800">
                          {displayAlt ? displayAlt.name : item.title}
                        </p>
                        {displayAlt?.price && (
                          <p className="text-xs text-emerald-600">{displayAlt.price}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Booking Required List */}
        {bookingItems.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-zinc-900">예약 필요 항목</h3>
            {bookingItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-zinc-200 p-4 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-900">{item.name}</p>
                  <p className="text-xs text-zinc-500 capitalize">{item.type}</p>
                </div>
                <BookingStatusBadge status={item.status} />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handleStartBooking}
            className="w-full py-3 bg-blue-600 text-white rounded-xl text-base font-semibold hover:bg-blue-700 transition-colors"
          >
            예약 시작하기 →
          </button>
        </div>
      </div>
    </div>
  )
}
