'use client'

import { useState, useEffect } from 'react'
import type { AccommodationResult } from '@/lib/accommodations/types'

interface AccommodationSectionProps {
  destination: string
  checkIn: string
  checkOut: string
  guests: number
}

export default function AccommodationSection({
  destination,
  checkIn,
  checkOut,
  guests,
}: AccommodationSectionProps) {
  const [results, setResults] = useState<AccommodationResult[]>([])
  const [activeTab, setActiveTab] = useState<'hotel' | 'airbnb'>('hotel')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    import('@/lib/accommodations/mock-provider').then(({ mockAccommodationProvider }) => {
      mockAccommodationProvider.search({ destination, checkIn, checkOut, guests }).then((data) => {
        if (!cancelled) {
          setResults(data)
          setLoading(false)
        }
      })
    })
    return () => { cancelled = true }
  }, [destination, checkIn, checkOut, guests])

  const filtered = results.filter((r) => {
    const src = (r as AccommodationResult & { source?: string }).source
    if (activeTab === 'hotel') return src === 'hotel' || r.type === 'hotel' || r.type === 'ryokan' || r.type === 'guesthouse'
    return src === 'airbnb' || r.type === 'other'
  })

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-zinc-200 p-4 animate-pulse">
        <div className="h-4 bg-zinc-100 rounded w-1/3 mb-3" />
        <div className="h-20 bg-zinc-100 rounded" />
      </div>
    )
  }

  if (results.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-zinc-200">
        {(['hotel', 'airbnb'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            {tab === 'hotel' ? '🏨 호텔·료칸' : '🏠 에어비앤비'}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="divide-y divide-zinc-100">
        {filtered.slice(0, 3).map((item) => (
          <div key={item.name} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-900 truncate">{item.name}</p>
                <p className="text-xs text-zinc-500 mt-0.5 truncate">{item.location}</p>
                {item.rating !== undefined && (
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs text-amber-500">⭐</span>
                    <span className="text-xs text-zinc-600">{item.rating.toFixed(1)}</span>
                    {item.reviewCount && (
                      <span className="text-xs text-zinc-400">({item.reviewCount.toLocaleString()})</span>
                    )}
                  </div>
                )}
                {item.amenities && item.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {item.amenities.slice(0, 3).map((a) => (
                      <span key={a} className="text-xs bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded">
                        {a}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-right flex-none">
                <p className="text-sm font-bold text-zinc-900">
                  ₩{item.pricePerNight.toLocaleString('ko-KR')}
                </p>
                <p className="text-xs text-zinc-400">/ 1박</p>
              </div>
            </div>
            {item.bookingUrl && (
              <a
                href={item.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2.5 flex items-center justify-center gap-1 w-full py-2 border border-blue-300 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-50 transition-colors"
              >
                예약하러 가기 →
              </a>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="p-6 text-center text-sm text-zinc-400">
          해당 탭의 숙박 옵션이 없습니다
        </div>
      )}
    </div>
  )
}
