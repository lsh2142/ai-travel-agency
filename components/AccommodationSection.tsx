'use client'

import { useState, useEffect } from 'react'
import type { AccommodationResult } from '@/lib/accommodations/types'

interface AccommodationSectionProps {
  destination: string
  checkIn: string
  checkOut: string
  guests?: number
}

type TabType = 'hotel' | 'airbnb'

function StarRating({ rating }: { rating?: number }) {
  if (!rating) return null
  const full = Math.floor(rating)
  const half = rating - full >= 0.5
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          className={`w-3 h-3 ${i < full ? 'text-amber-400' : i === full && half ? 'text-amber-300' : 'text-zinc-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.163c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118L10 14.347l-3.371 2.448c-.784.57-1.838-.197-1.539-1.118l1.286-3.957a1 1 0 00-.364-1.118L2.64 9.384c-.783-.57-.38-1.81.588-1.81h4.163a1 1 0 00.951-.69L9.049 2.927z" />
        </svg>
      ))}
      <span className="text-xs text-zinc-500 ml-1">{rating.toFixed(1)}</span>
    </span>
  )
}

function AccommodationCard({ acc }: { acc: AccommodationResult }) {
  const nights =
    acc.checkIn && acc.checkOut
      ? Math.max(1, Math.round((new Date(acc.checkOut).getTime() - new Date(acc.checkIn).getTime()) / 86_400_000))
      : 1

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-zinc-900 truncate">{acc.name}</p>
          <p className="text-xs text-zinc-500 mt-0.5 truncate">📍 {acc.location}</p>
          <div className="mt-1">
            <StarRating rating={acc.rating} />
          </div>
          {acc.reviewCount && (
            <p className="text-xs text-zinc-400 mt-0.5">리뷰 {acc.reviewCount.toLocaleString()}개</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-zinc-900">
            ₩{acc.pricePerNight.toLocaleString()}
          </p>
          <p className="text-xs text-zinc-400">1박 기준</p>
          {nights > 1 && (
            <p className="text-xs text-blue-600 font-medium mt-0.5">
              총 ₩{acc.totalPrice.toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {acc.amenities && acc.amenities.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {acc.amenities.slice(0, 4).map((a) => (
            <span key={a} className="px-1.5 py-0.5 bg-zinc-100 text-zinc-600 rounded text-xs">
              {a}
            </span>
          ))}
        </div>
      )}

      {acc.bookingUrl && (
        <a
          href={acc.bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center justify-center gap-1 w-full py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
        >
          예약하기 →
        </a>
      )}
    </div>
  )
}

export default function AccommodationSection({
  destination,
  checkIn,
  checkOut,
  guests = 2,
}: AccommodationSectionProps) {
  const [tab, setTab] = useState<TabType>('hotel')
  const [hotels, setHotels] = useState<AccommodationResult[]>([])
  const [airbnbs, setAirbnbs] = useState<AccommodationResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!destination || !checkIn || !checkOut) return

    setLoading(true)
    setError(null)

    const params = new URLSearchParams({ destination, checkIn, checkOut, guests: String(guests), type: 'all' })

    fetch(`/api/accommodations?${params}`)
      .then((r) => r.json())
      .then((data: { results?: AccommodationResult[]; error?: string }) => {
        if (data.error) throw new Error(data.error)
        const results = data.results ?? []
        setHotels(results.filter((r) => r.source === 'hotel'))
        setAirbnbs(results.filter((r) => r.source === 'airbnb'))
      })
      .catch((err) => setError(err.message ?? '숙박 정보를 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }, [destination, checkIn, checkOut, guests])

  const activeList = tab === 'hotel' ? hotels : airbnbs

  return (
    <section className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
      {/* Section header */}
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-base font-semibold text-zinc-900">🏨 숙박 추천</h2>
        <p className="text-xs text-zinc-500 mt-0.5">{destination} · {checkIn} ~ {checkOut}</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200 px-4">
        {(['hotel', 'airbnb'] as TabType[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`mr-4 pb-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            {t === 'hotel' ? `🏨 호텔 (${hotels.length})` : `🏡 Airbnb (${airbnbs.length})`}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4">
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-zinc-100 rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="py-6 text-center text-sm text-red-500">{error}</div>
        )}

        {!loading && !error && activeList.length === 0 && (
          <div className="py-6 text-center text-sm text-zinc-400">
            {tab === 'hotel' ? '호텔 정보가 없습니다.' : 'Airbnb 정보가 없습니다.'}
          </div>
        )}

        {!loading && !error && activeList.length > 0 && (
          <div className="space-y-3">
            {activeList.map((acc) => (
              <AccommodationCard key={acc.id} acc={acc} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
