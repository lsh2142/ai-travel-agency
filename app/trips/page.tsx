'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Trip, TripPlan } from '@/lib/types/travel'

type FilterTab = 'all' | 'upcoming' | 'completed'

function tripStatus(startDate: string, endDate: string): Trip['status'] {
  const now = Date.now()
  const start = new Date(startDate).getTime()
  const end = new Date(endDate).getTime()
  if (now > end) return 'completed'
  if (now >= start) return 'ongoing'
  return 'upcoming'
}

function mapLocalEntry(entry: { id: string; plan: TripPlan }): Trip {
  const start = entry.plan.params.dates?.start ?? entry.plan.createdAt.split('T')[0]
  const end = entry.plan.params.dates?.end ?? entry.plan.createdAt.split('T')[0]
  return {
    id: entry.id,
    title: `${entry.plan.params.destination || '여행'} 일정`,
    destination: entry.plan.params.destination || '미정',
    startDate: start,
    endDate: end,
    status: tripStatus(start, end),
    plan: entry.plan,
  }
}

function mapSupabaseRow(row: {
  id: string
  destination: string
  check_in: string
  check_out: string
  guests: number
  plan_data: TripPlan
  created_at: string
}): Trip {
  const start = row.check_in || row.created_at.split('T')[0]
  const end = row.check_out || row.created_at.split('T')[0]
  return {
    id: row.id,
    title: `${row.destination || '여행'} 일정`,
    destination: row.destination || '미정',
    startDate: start,
    endDate: end,
    status: tripStatus(start, end),
    plan: row.plan_data,
  }
}

function TripSummaryCard({ trip, onClick }: { trip: Trip; onClick: () => void }) {
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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadTrips() {
      // 1. Load from localStorage
      const localRaw = JSON.parse(localStorage.getItem('trips') ?? '[]') as Array<{
        id: string
        plan: TripPlan
      }>
      const localTrips = localRaw.map(mapLocalEntry)
      const localIds = new Set(localTrips.map((t) => t.id))

      // 2. Load from Supabase (if logged in)
      let supabaseTrips: Trip[] = []
      try {
        const res = await fetch('/api/trips')
        if (res.ok) {
          const rows = await res.json() as Parameters<typeof mapSupabaseRow>[0][]
          supabaseTrips = rows.map(mapSupabaseRow)
        }
      } catch {
        // not logged in or network error
      }

      // 3. Merge: Supabase is source of truth; append local-only entries
      const supabaseIds = new Set(supabaseTrips.map((t) => t.id))
      const localOnly = localTrips.filter((t) => !supabaseIds.has(t.id))
      const merged = [...supabaseTrips, ...localOnly]

      // Sync any supabase trips back into localStorage so detail page can find them
      const updatedLocal = [
        ...localRaw.filter((l) => !supabaseIds.has(l.id)),
        ...supabaseTrips
          .filter((t) => !localIds.has(t.id))
          .map((t) => ({ id: t.id, plan: t.plan })),
      ]
      localStorage.setItem('trips', JSON.stringify(updatedLocal))

      setTrips(merged)
      setLoading(false)
    }

    loadTrips()
  }, [])

  const tabs: { id: FilterTab; label: string }[] = [
    { id: 'all', label: '전체' },
    { id: 'upcoming', label: '예정' },
    { id: 'completed', label: '완료' },
  ]

  const filtered = trips.filter((t) => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'upcoming') return t.status === 'upcoming' || t.status === 'ongoing'
    return t.status === 'completed'
  })

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
        {loading ? (
          <div className="text-center py-16">
            <p className="text-sm text-zinc-400">여행 목록을 불러오는 중...</p>
          </div>
        ) : filtered.length === 0 ? (
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
