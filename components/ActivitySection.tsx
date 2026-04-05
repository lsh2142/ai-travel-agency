'use client'

import { useState, useEffect } from 'react'
import type { ActivityResult } from '@/lib/activities/types'

interface ActivitySectionProps {
  destination: string
  date?: string
  guests: number
}

export default function ActivitySection({ destination, date, guests }: ActivitySectionProps) {
  const [results, setResults] = useState<ActivityResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    import('@/lib/activities/mock-provider').then(({ mockActivityProvider }) => {
      mockActivityProvider.search({ destination, date, guests }).then((data) => {
        if (!cancelled) {
          setResults(data)
          setLoading(false)
        }
      })
    })
    return () => { cancelled = true }
  }, [destination, date, guests])

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-zinc-200 p-4 animate-pulse">
        <div className="h-4 bg-zinc-100 rounded w-1/4 mb-3" />
        <div className="h-20 bg-zinc-100 rounded" />
      </div>
    )
  }

  if (results.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
      <div className="px-4 pt-4 pb-2">
        <p className="text-sm font-semibold text-zinc-900">🎯 추천 액티비티</p>
      </div>
      <div className="divide-y divide-zinc-100">
        {results.slice(0, 3).map((item) => (
          <div key={item.id} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-900">{item.name}</p>
                <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{item.description}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs text-zinc-400">⏱ {item.duration}</span>
                  {item.rating !== undefined && (
                    <>
                      <span className="text-xs text-zinc-300">·</span>
                      <span className="text-xs text-amber-500">⭐ {item.rating.toFixed(1)}</span>
                    </>
                  )}
                </div>
                {item.highlights && item.highlights.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {item.highlights.slice(0, 3).map((h) => (
                      <span key={h} className="text-xs bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded">
                        {h}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-right flex-none">
                <p className="text-sm font-bold text-zinc-900">
                  ₩{item.pricePerPerson.toLocaleString('ko-KR')}
                </p>
                <p className="text-xs text-zinc-400">/ 1인</p>
              </div>
            </div>
            {item.bookingUrl && (
              <a
                href={item.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2.5 flex items-center justify-center gap-1 w-full py-2 border border-emerald-300 text-emerald-600 rounded-lg text-xs font-medium hover:bg-emerald-50 transition-colors"
              >
                예약하러 가기 →
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
