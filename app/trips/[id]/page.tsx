'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import type { Trip, TripDay } from '@/lib/types/travel'

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

function DayTimeline({ day }: { day: TripDay }) {
  const typeIcon: Record<string, string> = {
    accommodation: '🏨',
    activity: '🎯',
    restaurant: '🍽️',
    transport: '🚆',
    note: '📝',
  }
  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-4">
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
          const displayName = item.selectedAlternativeId
            ? (item.alternatives.find((a) => a.id === item.selectedAlternativeId)?.name ?? item.title)
            : item.title
          return (
            <div key={idx} className="flex items-start gap-2">
              <span className="flex-none text-xs text-zinc-400 w-10">{item.time}</span>
              <span className="flex-none">{typeIcon[item.type] ?? '📌'}</span>
              <p className="text-sm text-zinc-800">{displayName}</p>
            </div>
          )
        })}
        {day.items.length === 0 && (
          <p className="text-xs text-zinc-400">일정 없음</p>
        )}
      </div>
    </div>
  )
}

export default function TripDetailPage() {
  const router = useRouter()
  const params = useParams()
  const tripId = params.id as string
  const [trip, setTrip] = useState<Trip | null>(null)

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('trips') ?? '[]') as Array<{
      id: string
      plan: import('@/lib/types/travel').TripPlan
    }>
    const entry = stored.find((t) => t.id === tripId)
    if (!entry) {
      // Try sessionStorage (in-progress trip)
      const planStored = sessionStorage.getItem('tripPlan')
      if (planStored) {
        const plan = JSON.parse(planStored) as import('@/lib/types/travel').TripPlan
        setTrip({
          id: tripId,
          title: `${plan.params.destination || '여행'} 일정`,
          destination: plan.params.destination || '미정',
          startDate: plan.params.dates?.start ?? plan.createdAt.split('T')[0],
          endDate: plan.params.dates?.end ?? plan.createdAt.split('T')[0],
          status: 'upcoming',
          plan,
        })
      } else {
        router.replace('/trips')
      }
      return
    }
    setTrip({
      id: entry.id,
      title: `${entry.plan.params.destination || '여행'} 일정`,
      destination: entry.plan.params.destination || '미정',
      startDate: entry.plan.params.dates?.start ?? entry.plan.createdAt.split('T')[0],
      endDate: entry.plan.params.dates?.end ?? entry.plan.createdAt.split('T')[0],
      status: 'upcoming',
      plan: entry.plan,
    })
  }, [tripId, router])

  if (!trip) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <p className="text-sm text-zinc-500">여행 정보를 불러오는 중...</p>
      </div>
    )
  }

  const { plan } = trip
  const bookingItems = plan.bookingItems ?? []
  const dday = trip.startDate
    ? Math.ceil((new Date(trip.startDate).getTime() - Date.now()) / 86400000)
    : null

  return (
    <div className="min-h-screen bg-zinc-50 pb-8">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button onClick={() => router.push('/trips')} className="text-sm text-zinc-500 hover:text-zinc-800">
            ← 내 여행
          </button>
          <h1 className="text-base font-semibold text-zinc-900">여행 상세</h1>
          <span />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-6">
        {/* Trip Header */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-zinc-900">{trip.title}</h2>
              <p className="text-sm text-zinc-500 mt-1">
                {trip.startDate} ~ {trip.endDate}
              </p>
              <p className="text-sm text-zinc-600 mt-0.5">👥 {plan.params.people}명</p>
            </div>
            {dday !== null && dday >= 0 && (
              <div className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-xl text-center">
                <p className="text-xs font-medium">D-DAY</p>
                <p className="text-xl font-bold">{dday === 0 ? 'Day' : `-${dday}`}</p>
              </div>
            )}
          </div>
          {plan.params.themes.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {plan.params.themes.map((t) => (
                <span key={t} className="px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded-full text-xs">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Itinerary */}
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-zinc-900">전체 일정</h3>
          {plan.days.map((day) => (
            <DayTimeline key={day.dayNumber} day={day} />
          ))}
        </div>

        {/* Booking Status */}
        {bookingItems.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-zinc-900">예약 현황</h3>
            {bookingItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-zinc-200 p-4 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-900">{item.name}</p>
                  <p className="text-xs text-zinc-500 capitalize mt-0.5">{item.type}</p>
                </div>
                <BookingStatusBadge status={item.isCompleted ? 'booked' : item.status} />
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/')}
            className="flex-1 py-2.5 border border-zinc-300 text-zinc-700 rounded-xl text-sm font-medium hover:bg-zinc-50"
          >
            새 여행 계획
          </button>
          <button
            onClick={() => router.push('/booking')}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700"
          >
            예약 계속하기
          </button>
        </div>
      </main>
    </div>
  )
}
