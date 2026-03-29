'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { TravelParams, TripPlan, TripDayItem, Alternative } from '@/lib/types/travel'
import { parseItineraryResponse } from '@/lib/ai/travel-itinerary-agent'

const GENERATION_STEPS = [
  '여행 조건 분석 중...',
  '최적 경로 계산 중...',
  '숙소 후보 검색 중...',
  '액티비티 검색 중...',
  '일정 조합 중...',
  '대안 옵션 준비 중...',
]

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

function AlternativeSelector({
  alternatives,
  selectedId,
  onSelect,
}: {
  alternatives: Alternative[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  if (alternatives.length === 0) return null
  return (
    <div className="mt-3">
      <p className="text-xs font-medium text-zinc-500 mb-2">대안 선택</p>
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
        {alternatives.map((alt) => (
          <button
            key={alt.id}
            type="button"
            onClick={() => onSelect(alt.id)}
            className={`flex-none w-52 rounded-xl border p-3 text-left transition-all ${
              selectedId === alt.id
                ? 'border-blue-600 bg-blue-50'
                : 'border-zinc-200 bg-white hover:border-zinc-400'
            }`}
          >
            <p className="text-sm font-semibold text-zinc-900 truncate">{alt.name}</p>
            <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{alt.description}</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs font-medium text-blue-600">{alt.price}</span>
              {alt.rating && (
                <span className="text-xs text-amber-500">★ {alt.rating}</span>
              )}
            </div>
            {alt.bookingUrl && alt.bookingUrl !== '#' && (
              <a
                href={alt.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block mt-2 text-xs text-blue-600 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                예약 링크 →
              </a>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

function DayItemCard({
  item,
  selectedAltId,
  onSelectAlt,
}: {
  item: TripDayItem
  selectedAltId: string | null
  onSelectAlt: (id: string) => void
}) {
  const typeIcon: Record<string, string> = {
    accommodation: '🏨',
    activity: '🎯',
    restaurant: '🍽️',
    transport: '🚆',
    note: '📝',
  }
  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <span className="text-base">{typeIcon[item.type] ?? '📌'}</span>
          <div>
            <p className="text-sm font-semibold text-zinc-900">{item.title}</p>
            <p className="text-xs text-zinc-500">{item.time}</p>
            {item.description && (
              <p className="text-xs text-zinc-600 mt-1">{item.description}</p>
            )}
          </div>
        </div>
        <BookingStatusBadge status="pending" />
      </div>
      {item.alternatives.length > 0 && (
        <AlternativeSelector
          alternatives={item.alternatives}
          selectedId={selectedAltId}
          onSelect={onSelectAlt}
        />
      )}
    </div>
  )
}

export default function PlanPage() {
  const router = useRouter()
  const [params, setParams] = useState<TravelParams | null>(null)
  const [plan, setPlan] = useState<TripPlan | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [selectedAlternatives, setSelectedAlternatives] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const rawBuffer = useRef('')

  useEffect(() => {
    const stored = sessionStorage.getItem('travelParams')
    if (!stored) {
      router.replace('/')
      return
    }
    const p = JSON.parse(stored) as TravelParams
    setParams(p)
    generatePlan(p)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function generatePlan(p: TravelParams) {
    setIsGenerating(true)
    setError(null)
    rawBuffer.current = ''

    const stepInterval = setInterval(() => {
      setStepIndex((i) => (i < GENERATION_STEPS.length - 1 ? i + 1 : i))
    }, 2000)

    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p),
      })
      if (!res.ok || !res.body) throw new Error('API error')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        rawBuffer.current += decoder.decode(value, { stream: true })
      }

      const parsed = parseItineraryResponse(rawBuffer.current)
      parsed.params = p
      setPlan(parsed)
      sessionStorage.setItem('tripPlan', JSON.stringify(parsed))
    } catch (e) {
      setError(e instanceof Error ? e.message : '일정 생성 중 오류가 발생했습니다')
    } finally {
      clearInterval(stepInterval)
      setIsGenerating(false)
    }
  }

  function handleSelectAlt(itemKey: string, altId: string) {
    setSelectedAlternatives((prev) => ({ ...prev, [itemKey]: altId }))
  }

  function handleConfirm() {
    if (!plan) return
    const updatedPlan: TripPlan = {
      ...plan,
      status: 'confirmed',
      days: plan.days.map((day) => ({
        ...day,
        items: day.items.map((item) => {
          const key = `day${day.dayNumber}_${item.type}`
          return { ...item, selectedAlternativeId: selectedAlternatives[key] }
        }),
      })),
    }
    sessionStorage.setItem('tripPlan', JSON.stringify(updatedPlan))
    router.push('/plan/confirm')
  }

  if (isGenerating || !plan) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <p className="text-4xl mb-3">🗺️</p>
            <h1 className="text-xl font-bold text-zinc-900">
              {params?.destination
                ? `${params.destination} 일정 생성 중`
                : '일정 생성 중'}
            </h1>
          </div>

          {/* Progress bar */}
          <div className="bg-zinc-200 rounded-full h-2 mb-4 overflow-hidden">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{
                width: `${((stepIndex + 1) / GENERATION_STEPS.length) * 100}%`,
              }}
            />
          </div>

          <div className="space-y-2">
            {GENERATION_STEPS.map((step, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 text-sm transition-opacity ${
                  i <= stepIndex ? 'opacity-100' : 'opacity-30'
                }`}
              >
                <span>{i < stepIndex ? '✅' : i === stepIndex ? '⏳' : '○'}</span>
                <span className={i === stepIndex ? 'text-blue-600 font-medium' : 'text-zinc-600'}>
                  {step}
                </span>
              </div>
            ))}
          </div>

          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={() => params && generatePlan(params)}
                className="mt-2 text-sm text-blue-600 hover:underline"
              >
                다시 시도
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button onClick={() => router.back()} className="text-sm text-zinc-500 hover:text-zinc-800">
            ← 뒤로
          </button>
          <h1 className="text-base font-semibold text-zinc-900">
            {plan.params.destination || '여행'} 일정
          </h1>
          <span className="text-xs text-zinc-400">{plan.days.length}일</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-6">
        {plan.days.map((day) => (
          <section key={day.dayNumber}>
            <div className="flex items-center gap-2 mb-3">
              <span className="flex-none w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                {day.dayNumber}
              </span>
              <div>
                <p className="text-sm font-semibold text-zinc-900">{day.title}</p>
                <p className="text-xs text-zinc-500">{day.date}</p>
              </div>
            </div>
            <div className="space-y-3 pl-10">
              {day.items.map((item, idx) => {
                const key = `day${day.dayNumber}_${item.type}`
                return (
                  <DayItemCard
                    key={idx}
                    item={item}
                    selectedAltId={selectedAlternatives[key] ?? null}
                    onSelectAlt={(altId) => handleSelectAlt(key, altId)}
                  />
                )
              })}
              {day.items.length === 0 && (
                <p className="text-sm text-zinc-400">일정 항목이 없습니다</p>
              )}
            </div>
          </section>
        ))}
      </main>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handleConfirm}
            className="w-full py-3 bg-blue-600 text-white rounded-xl text-base font-semibold hover:bg-blue-700 transition-colors"
          >
            이 일정으로 진행하기 →
          </button>
        </div>
      </div>
    </div>
  )
}
