'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Trip } from '@/lib/types/travel'

type FilterTab = 'all' | 'upcoming' | 'completed'

function TripSummaryCard({
  trip,
  onClick,
}: {
  trip: Trip
  onClick: () => void
}) {
  const statusLabel: Record<Trip['status'], string> = {
    upcoming: '예정',
    ongoing: '진행 중',
    completed: '완료',
  }
  const statusCls: Record<Trip['status'], string> = {
    upcoming: 'bg-blue-100 text-blue-700',
    ongoing: 'bg-amber-100 text-amber-700',
    completed: 'bg-zinc-100 text-zinc-600',
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full bg-white rounded-2xl border border-zinc-200 p-4 text-left hover:border-zinc-400 transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-base font-semibold text-zinc-900">{trip.title}</p>
          <p className="text-sm text-zinc-600 mt-0.5">{trip.destination}</p>
        </div>
        <span className={`flex-none px-2 py-0.5 rounded-full text-xs font-medium ${statusCls[trip.status]}`}>
          {statusLabel[trip.status]}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-3 text-xs text-zinc-500">
        <span>📅 {trip.startDate} ~ {trip.endDate}</span>
      </div>
    </button>
  )
}

export default function TripsPage() {
  const router = useRouter()
  const [trips, setTrips] = useState<Trip[]>([])
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')

  useEffect(() => {
    // Load trips from localStorage (demo)
    const stored = JSON.parse(localStorage.getItem('trips') ?? '[]') as Array<{
      id: string
      plan: import('@/lib/types/travel').TripPlan
    }>

    const mapped: Trip[] = stored.map((entry) => ({
      id: entry.id,
      title: `${entry.plan.params.destination || '여행'} 일정`,
      destination: entry.plan.params.destination || '미정',
      startDate: entry.plan.params.dates?.start ?? entry.plan.createdAt.split('T')[0],
      endDate: entry.plan.params.dates?.end ?? entry.plan.createdAt.split('T')[0],
      status: 'upcoming' as const,
      plan: entry.plan,
    }))

    setTrips(mapped)
  }, [])

  const filtered = trips.filter((t) => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'upcoming') return t.status === 'upcoming' || t.status === 'ongoing'
    return t.status === 'completed'
  })

  const tabs: { id: FilterTab; label: string }[] = [
    { id: 'all', label: '전체' },
    { id: 'upcoming', label: '예정' },
    { id: 'completed', label: '완료' },
  ]

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button onClick={() => router.push('/')} className="text-sm text-zinc-500 hover:text-zinc-800">
            ← 홈
          </button>
          <h1 className="text-base font-semibold text-zinc-900">내 여행</h1>
          <span />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4">
        {/* Filter Tabs */}
        <div className="flex gap-1 bg-zinc-100 p-1 rounded-xl mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id)}
              className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeFilter === tab.id
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Trip List */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🗺️</p>
            <p className="text-base font-semibold text-zinc-900">여행이 없습니다</p>
            <p className="text-sm text-zinc-500 mt-1">새 여행을 계획해보세요!</p>
            <button
              onClick={() => router.push('/')}
              className="mt-4 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700"
            >
              여행 계획하기 →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((trip) => (
              <TripSummaryCard
                key={trip.id}
                trip={trip}
                onClick={() => router.push(`/trips/${trip.id}`)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
