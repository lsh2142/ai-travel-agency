'use client'

import { useState, useEffect } from 'react'
import type { ActivityResult, ActivityCategory } from '@/lib/activities/types'

interface ActivitySectionProps {
  destination: string
  date?: string
  guests?: number
}

const CATEGORY_LABELS: Record<ActivityCategory | 'all', string> = {
  all: '전체',
  tour: '투어',
  experience: '체험',
  outdoor: '야외',
  culture: '문화',
  food: '식도락',
  transport: '교통',
  other: '기타',
}

const CATEGORY_ICONS: Record<ActivityCategory | 'all', string> = {
  all: '🔍',
  tour: '🗺️',
  experience: '🎨',
  outdoor: '🏔️',
  culture: '🏛️',
  food: '🍜',
  transport: '🚌',
  other: '📌',
}

function ActivityCard({ activity }: { activity: ActivityResult }) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">{CATEGORY_ICONS[activity.category]}</span>
            <p className="text-sm font-semibold text-zinc-900 truncate">{activity.name}</p>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5 truncate">📍 {activity.location}</p>
          {activity.duration && (
            <p className="text-xs text-zinc-400 mt-0.5">⏱ {activity.duration}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          {activity.pricePerPerson > 0 ? (
            <>
              <p className="text-sm font-bold text-zinc-900">
                ₩{activity.pricePerPerson.toLocaleString()}
              </p>
              <p className="text-xs text-zinc-400">1인 기준</p>
              {activity.totalPrice > activity.pricePerPerson && (
                <p className="text-xs text-blue-600 font-medium mt-0.5">
                  총 ₩{activity.totalPrice.toLocaleString()}
                </p>
              )}
            </>
          ) : (
            <span className="text-xs text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded">가격 문의</span>
          )}
        </div>
      </div>

      <p className="mt-2 text-xs text-zinc-600 line-clamp-2">{activity.description}</p>

      {activity.highlights && activity.highlights.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {activity.highlights.slice(0, 3).map((h) => (
            <span key={h} className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">
              ✓ {h}
            </span>
          ))}
        </div>
      )}

      {activity.rating && (
        <div className="mt-2 flex items-center gap-1 text-xs text-zinc-500">
          <span className="text-amber-400">★</span>
          <span>{activity.rating.toFixed(1)}</span>
          {activity.reviewCount && <span className="text-zinc-400">({activity.reviewCount.toLocaleString()})</span>}
        </div>
      )}

      {activity.bookingUrl && (
        <a
          href={activity.bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center justify-center gap-1 w-full py-2 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors"
        >
          예약하기 →
        </a>
      )}
    </div>
  )
}

export default function ActivitySection({
  destination,
  date,
  guests = 2,
}: ActivitySectionProps) {
  const [activities, setActivities] = useState<ActivityResult[]>([])
  const [filtered, setFiltered] = useState<ActivityResult[]>([])
  const [activeCategory, setActiveCategory] = useState<ActivityCategory | 'all'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!destination) return

    setLoading(true)
    setError(null)

    const params = new URLSearchParams({ destination, guests: String(guests) })
    if (date) params.set('date', date)

    fetch(`/api/activities?${params}`)
      .then((r) => r.json())
      .then((data: { results?: ActivityResult[]; error?: string }) => {
        if (data.error) throw new Error(data.error)
        setActivities(data.results ?? [])
        setFiltered(data.results ?? [])
      })
      .catch((err) => setError(err.message ?? '액티비티 정보를 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }, [destination, date, guests])

  // Derive unique categories from results
  const availableCategories = ['all', ...Array.from(new Set(activities.map((a) => a.category)))] as (ActivityCategory | 'all')[]

  function handleCategoryChange(cat: ActivityCategory | 'all') {
    setActiveCategory(cat)
    setFiltered(cat === 'all' ? activities : activities.filter((a) => a.category === cat))
  }

  return (
    <section className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
      {/* Section header */}
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-base font-semibold text-zinc-900">🎯 액티비티 추천</h2>
        <p className="text-xs text-zinc-500 mt-0.5">{destination}{date ? ` · ${date}` : ''}</p>
      </div>

      {/* Category filter chips */}
      {!loading && activities.length > 0 && (
        <div className="px-4 pb-2 flex gap-1.5 overflow-x-auto scrollbar-none">
          {availableCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="p-4 pt-2">
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-zinc-100 rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="py-6 text-center text-sm text-red-500">{error}</div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="py-6 text-center text-sm text-zinc-400">
            해당 카테고리의 액티비티가 없습니다.
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map((act) => (
              <ActivityCard key={act.id} activity={act} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
