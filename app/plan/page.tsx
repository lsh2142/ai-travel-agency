'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { TravelParams, TripPlan, TripDay, TripDayItem, Alternative, BookingItem } from '@/lib/types/travel'
import {
  extractBlocksFromBuffer,
  applyBlocksToPlan,
  type ParsedBlock,
} from '@/lib/ai/travel-itinerary-agent'

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
              <span className="text-base font-semibold text-emerald-600">{alt.price}</span>
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
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <span className="text-base flex-none">{typeIcon[item.type] ?? '📌'}</span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-900">{item.title}</p>
            <p className="text-xs text-zinc-500">{item.time}</p>
            {item.description && (
              <p className="text-xs text-zinc-600 mt-1">{item.description}</p>
            )}
          </div>
        </div>
        <BookingStatusBadge status="pending" />
      </div>
      {item.alternatives.length > 0 ? (
        <AlternativeSelector
          alternatives={item.alternatives}
          selectedId={selectedAltId}
          onSelect={onSelectAlt}
        />
      ) : (item.type === 'accommodation' || item.type === 'activity') ? (
        <p className="mt-2 text-xs text-zinc-400 italic">대안 로딩 중...</p>
      ) : null}
    </div>
  )
}

function DaySection({
  day,
  selectedAlternatives,
  onSelectAlt,
}: {
  day: TripDay
  selectedAlternatives: Record<string, string>
  onSelectAlt: (key: string, altId: string) => void
}) {
  return (
    <section>
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
              onSelectAlt={(altId) => onSelectAlt(key, altId)}
            />
          )
        })}
        {day.items.length === 0 && (
          <p className="text-sm text-zinc-400">일정 항목이 없습니다</p>
        )}
      </div>
    </section>
  )
}

export default function PlanPage() {
  const router = useRouter()
  const [params, setParams] = useState<TravelParams | null>(null)
  // 스트리밍 중에도 점진적으로 렌더링할 days
  const [days, setDays] = useState<TripDay[]>([])
  const [bookingItems, setBookingItems] = useState<BookingItem[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedAlternatives, setSelectedAlternatives] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)

  // 스트리밍 파서 상태 (ref: 렌더링 트리거 없음)
  const rawBuffer = useRef('')
  const consumedPos = useRef(0)
  // 누적된 모든 블록 (alt 연결에 재사용)
  const allBlocks = useRef<ParsedBlock[]>([])

  useEffect(() => {
    const stored = sessionStorage.getItem('travelParams')
    if (!stored) { router.replace('/'); return }
    const p = JSON.parse(stored) as TravelParams
    setParams(p)

    // 이미 완성된 플랜이 캐시에 있으면 재생성 스킵
    const cached = sessionStorage.getItem('tripPlan')
    if (cached) {
      try {
        const cachedPlan = JSON.parse(cached) as TripPlan
        if (cachedPlan.days?.length > 0) {
          setDays(cachedPlan.days)
          setBookingItems(cachedPlan.bookingItems ?? [])
          setIsGenerating(false)
          return
        }
      } catch {
        // 캐시 파싱 실패 시 재생성
      }
    }

    startGeneration(p)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const startGeneration = useCallback(async (p: TravelParams) => {
    setIsGenerating(true)
    setError(null)
    setDays([])
    setBookingItems([])
    rawBuffer.current = ''
    consumedPos.current = 0
    allBlocks.current = []

    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p),
      })
      if (!res.ok || !res.body) throw new Error('API 오류')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        rawBuffer.current += decoder.decode(value, { stream: true })

        // 새로 완성된 블록 추출 — 스트리밍 중 즉시 파싱
        const { blocks, consumed } = extractBlocksFromBuffer(
          rawBuffer.current,
          consumedPos.current
        )

        if (blocks.length > 0) {
          consumedPos.current = consumed
          allBlocks.current = [...allBlocks.current, ...blocks]

          // days/bookingItems 상태를 점진적으로 업데이트
          setDays((prevDays) => {
            const { days: nextDays, bookingItems: nextItems } = applyBlocksToPlan(
              prevDays,
              blocks,
              p
            )
            setBookingItems((prev) => {
              // bookingItems 중복 방지: name 기준으로 dedup
              const existingNames = new Set(prev.map((b) => b.name))
              const fresh = nextItems.filter((b) => !existingNames.has(b.name))
              return fresh.length > 0 ? [...prev, ...fresh] : prev
            })
            return nextDays
          })
        }
      }

      // 스트림 종료 후 미처리된 나머지 재파싱 (엣지 케이스)
      const { blocks: remaining } = extractBlocksFromBuffer(
        rawBuffer.current,
        consumedPos.current
      )
      if (remaining.length > 0) {
        allBlocks.current = [...allBlocks.current, ...remaining]
        setDays((prevDays) => {
          const { days: nextDays, bookingItems: nextItems } = applyBlocksToPlan(
            prevDays,
            remaining,
            p
          )
          setBookingItems((prev) => {
            const existingNames = new Set(prev.map((b) => b.name))
            const fresh = nextItems.filter((b) => !existingNames.has(b.name))
            return fresh.length > 0 ? [...prev, ...fresh] : prev
          })
          return nextDays
        })
      }

      // sessionStorage 저장
      const finalPlan: TripPlan = {
        id: crypto.randomUUID(),
        params: p,
        days: [],        // setDays callback에서 최신 값을 가져올 수 없으므로 아래서 덮어씀
        bookingItems: [],
        status: 'draft',
        createdAt: new Date().toISOString(),
      }
      // 최신 days/bookingItems는 state 업데이트 후 effect로 저장
    } catch (e) {
      setError(e instanceof Error ? e.message : '일정 생성 중 오류가 발생했습니다')
    } finally {
      setIsGenerating(false)
    }
  }, [])

  // 생성 완료 후 sessionStorage 저장 (days가 최종 확정됐을 때)
  useEffect(() => {
    if (!isGenerating && days.length > 0 && params) {
      const plan: TripPlan = {
        id: crypto.randomUUID(),
        params,
        days,
        bookingItems,
        status: 'draft',
        createdAt: new Date().toISOString(),
      }
      sessionStorage.setItem('tripPlan', JSON.stringify(plan))
    }
  }, [isGenerating, days, bookingItems, params])

  function handleSelectAlt(key: string, altId: string) {
    setSelectedAlternatives((prev) => ({ ...prev, [key]: altId }))
  }

  function handleConfirm() {
    if (!params) return
    const plan: TripPlan = {
      id: crypto.randomUUID(),
      params,
      days: days.map((day) => ({
        ...day,
        items: day.items.map((item) => {
          const key = `day${day.dayNumber}_${item.type}`
          return { ...item, selectedAlternativeId: selectedAlternatives[key] }
        }),
      })),
      bookingItems,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    }
    sessionStorage.setItem('tripPlan', JSON.stringify(plan))
    router.push('/plan/confirm')
  }

  // 첫 Day가 도착하기 전: 전체 화면 로딩
  if (isGenerating && days.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <p className="text-4xl mb-3">🗺️</p>
          <h1 className="text-xl font-bold text-zinc-900 mb-6">
            {params?.destination ? `${params.destination} 일정 생성 중` : '일정 생성 중'}
          </h1>
          <div className="bg-zinc-200 rounded-full h-2 overflow-hidden">
            <div className="bg-blue-600 h-2 rounded-full animate-pulse w-1/3" />
          </div>
          <p className="mt-3 text-sm text-zinc-500">첫 번째 일정을 준비하고 있어요...</p>
        </div>
      </div>
    )
  }

  if (!isGenerating && days.length === 0 && error) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-sm w-full">
          <p className="text-sm text-red-700 mb-3">{error}</p>
          <button
            onClick={() => params && startGeneration(params)}
            className="text-sm text-blue-600 hover:underline"
          >
            다시 시도
          </button>
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
            {params?.destination || '여행'} 일정
          </h1>
          <span className="text-xs text-zinc-400">
            {isGenerating ? (
              <span className="text-blue-500 animate-pulse">생성 중...</span>
            ) : (
              `${days.length}일`
            )}
          </span>
        </div>
      </header>

      {/* 스트리밍 중 상단 진행바 */}
      {isGenerating && (
        <div className="bg-zinc-200 h-0.5">
          <div className="bg-blue-500 h-0.5 animate-pulse w-full" />
        </div>
      )}

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-6">
        {days.map((day) => (
          <DaySection
            key={day.dayNumber}
            day={day}
            selectedAlternatives={selectedAlternatives}
            onSelectAlt={handleSelectAlt}
          />
        ))}

        {/* 스트리밍 중 다음 일정 도착 대기 스켈레톤 */}
        {isGenerating && (
          <div className="space-y-3 animate-pulse">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-zinc-200 rounded-full" />
              <div className="h-4 bg-zinc-200 rounded w-32" />
            </div>
            <div className="pl-10 space-y-3">
              <div className="bg-zinc-100 rounded-xl h-16" />
              <div className="bg-zinc-100 rounded-xl h-16" />
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
      </main>

      {/* Bottom CTA — 첫 Day 도착하면 바로 표시 */}
      {days.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 px-4 py-3">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={handleConfirm}
              className="w-full py-3 bg-blue-600 text-white rounded-xl text-base font-semibold hover:bg-blue-700 transition-colors"
            >
              {isGenerating ? '생성 중에도 진행 가능 →' : '이 일정으로 진행하기 →'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
