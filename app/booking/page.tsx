'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { TripPlan, BookingItem } from '@/lib/types/travel'

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

function ManualBookingCard({
  item,
  isCompleted,
  onComplete,
  onSkip,
}: {
  item: BookingItem
  isCompleted: boolean
  onComplete: () => void
  onSkip: () => void
}) {
  const [expanded, setExpanded] = useState(true)
  const typeIcon: Record<string, string> = {
    flight: '✈️',
    accommodation: '🏨',
    activity: '🎯',
    transport: '🚆',
  }

  return (
    <div className={`bg-white rounded-2xl border p-4 transition-all ${isCompleted ? 'border-emerald-300 opacity-70' : 'border-zinc-200'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <span className="text-lg">{typeIcon[item.type] ?? '📋'}</span>
          <div>
            <p className="text-sm font-semibold text-zinc-900">{item.name}</p>
            <BookingStatusBadge status={isCompleted ? 'booked' : item.status} />
          </div>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="text-xs text-zinc-400 hover:text-zinc-700"
        >
          {expanded ? '접기' : '펼치기'}
        </button>
      </div>

      {expanded && !isCompleted && (
        <>
          <div className="mt-3 space-y-1.5">
            <p className="text-xs font-medium text-zinc-600">예약 방법:</p>
            {item.guide.map((step, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="flex-none text-xs text-zinc-400 w-4">{i + 1}.</span>
                <p className="text-xs text-zinc-700">{step}</p>
              </div>
            ))}
          </div>

          {item.bookingUrl && item.bookingUrl !== '#' && (
            <a
              href={item.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-1 w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              예약 링크로 이동 →
            </a>
          )}

          {item.type === 'accommodation' && (
            <button
              type="button"
              className="mt-2 w-full py-2 border border-blue-300 text-blue-600 rounded-lg text-sm hover:bg-blue-50 transition-colors"
            >
              🔔 빈방 모니터링 등록
            </button>
          )}

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={onComplete}
              className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              완료 ✓
            </button>
            <button
              type="button"
              onClick={onSkip}
              className="flex-1 py-2 border border-zinc-300 text-zinc-600 rounded-lg text-sm hover:bg-zinc-50 transition-colors"
            >
              건너뜀
            </button>
          </div>
        </>
      )}

      {isCompleted && (
        <p className="mt-2 text-xs text-emerald-600 font-medium">예약 완료!</p>
      )}
    </div>
  )
}

export default function BookingPage() {
  const router = useRouter()
  const [plan, setPlan] = useState<TripPlan | null>(null)
  const [bookingItems, setBookingItems] = useState<BookingItem[]>([])
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
  const [skippedIds, setSkippedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const stored = sessionStorage.getItem('tripPlan')
    if (!stored) {
      router.replace('/plan/confirm')
      return
    }
    const p = JSON.parse(stored) as TripPlan
    setPlan(p)

    // Build booking items from plan if none exist
    const items =
      p.bookingItems.length > 0
        ? p.bookingItems
        : p.days.flatMap((day) =>
            day.items
              .filter((item) => ['accommodation', 'activity', 'transport'].includes(item.type))
              .map((item, idx) => ({
                id: `${day.dayNumber}_${idx}`,
                type: item.type === 'note' ? 'activity' : (item.type as BookingItem['type']),
                name: item.title,
                bookingUrl: item.bookingUrl ?? '#',
                guide: [
                  '아래 링크를 탭하세요',
                  '날짜·인원을 확인하세요',
                  '결제를 진행하세요',
                  '예약 확인 번호를 저장하세요',
                ],
                status: 'pending' as const,
                isCompleted: false,
              }))
          )

    setBookingItems(items)
  }, [router])

  function handleComplete(id: string) {
    setCompletedIds((prev) => new Set([...prev, id]))
  }

  function handleSkip(id: string) {
    setSkippedIds((prev) => new Set([...prev, id]))
  }

  const processedCount = completedIds.size + skippedIds.size
  const totalCount = bookingItems.length
  const allProcessed = totalCount > 0 && processedCount >= totalCount

  async function handleFinish() {
    const tripId = plan?.id ?? crypto.randomUUID()

    // Save to localStorage
    const trips = JSON.parse(localStorage.getItem('trips') ?? '[]')
    const alreadySaved = trips.some((t: { id: string }) => t.id === tripId)
    if (!alreadySaved) {
      trips.push({ id: tripId, plan, completedAt: new Date().toISOString() })
      localStorage.setItem('trips', JSON.stringify(trips))
    }

    // Save to Supabase if logged in (best-effort, silent fail)
    try {
      await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: tripId,
          destination: plan!.params.destination,
          check_in: plan!.params.dates?.start ?? null,
          check_out: plan!.params.dates?.end ?? null,
          guests: plan!.params.people,
          plan_data: plan,
        }),
      })
    } catch {
      // not logged in or network error — localStorage is the fallback
    }

    router.push(`/trips/${tripId}`)
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <p className="text-sm text-zinc-500">예약 목록을 불러오는 중...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button onClick={() => router.back()} className="text-sm text-zinc-500 hover:text-zinc-800">
            ← 이전
          </button>
          <h1 className="text-base font-semibold text-zinc-900">예약 진행</h1>
          <span className="text-xs text-zinc-500">{processedCount}/{totalCount}</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Progress */}
        <div>
          <div className="flex justify-between text-xs text-zinc-500 mb-1">
            <span>전체 진행률</span>
            <span>{totalCount > 0 ? Math.round((processedCount / totalCount) * 100) : 0}%</span>
          </div>
          <div className="bg-zinc-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: totalCount > 0 ? `${(processedCount / totalCount) * 100}%` : '0%' }}
            />
          </div>
        </div>

        {bookingItems.length === 0 && (
          <div className="bg-white rounded-2xl border border-zinc-200 p-8 text-center">
            <p className="text-4xl mb-2">🎉</p>
            <p className="text-base font-semibold text-zinc-900">예약할 항목이 없습니다</p>
            <p className="text-sm text-zinc-500 mt-1">일정이 모두 확정됐어요!</p>
          </div>
        )}

        {bookingItems.map((item) => (
          <ManualBookingCard
            key={item.id}
            item={item}
            isCompleted={completedIds.has(item.id) || skippedIds.has(item.id)}
            onComplete={() => handleComplete(item.id)}
            onSkip={() => handleSkip(item.id)}
          />
        ))}

        {allProcessed && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center">
            <p className="text-2xl mb-1">🎉</p>
            <p className="text-base font-semibold text-emerald-800">모든 항목 처리 완료!</p>
          </div>
        )}
      </main>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handleFinish}
            disabled={!allProcessed && processedCount === 0}
            className="w-full py-3 bg-blue-600 text-white rounded-xl text-base font-semibold hover:bg-blue-700 disabled:opacity-40 transition-colors"
          >
            {allProcessed ? '여행 저장 완료 →' : '일단 저장하고 나중에 예약하기'}
          </button>
        </div>
      </div>
    </div>
  )
}
