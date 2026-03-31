'use client'

import { useState } from 'react'
import type { Alternative } from '@/lib/types/travel'

interface CheaperAlternativesPanelProps {
  currentPrice: number
  alternatives: Alternative[]
  onSwitch: (alt: Alternative) => void
  threshold?: number
}

export function CheaperAlternativesPanel({
  currentPrice,
  alternatives,
  onSwitch,
  threshold = 150000,
}: CheaperAlternativesPanelProps) {
  const [expanded, setExpanded] = useState(true)

  // Extract numeric price from Alternative.price string
  function extractPriceNumber(priceStr: string): number {
    const cleaned = priceStr.replace(/,/g, '').replace(/\s/g, '')
    const m = cleaned.match(/(\d+)/)
    return m ? parseInt(m[1]) : 0
  }

  // Filter cheaper alternatives
  const cheaperAlts = alternatives.filter((alt) => {
    const altPrice = extractPriceNumber(alt.price)
    return altPrice < currentPrice
  })

  // Render nothing if threshold not met or no cheaper alternatives
  if (currentPrice < threshold || cheaperAlts.length === 0) {
    return null
  }

  // Sort by price ascending (cheapest first)
  const sortedCheaper = [...cheaperAlts].sort((a, b) => {
    const aPrice = extractPriceNumber(a.price)
    const bPrice = extractPriceNumber(b.price)
    return aPrice - bPrice
  })

  return (
    <div className="mt-3 border border-amber-200 bg-amber-50 rounded-lg p-3">
      {/* Header with toggle */}
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            setExpanded(!expanded)
          }
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-amber-900">💰 더 저렴한 대안</span>
          <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
            {sortedCheaper.length}개
          </span>
        </div>
        <button
          type="button"
          className="text-xs text-amber-600 hover:text-amber-800 transition-colors"
          onClick={(e) => {
            e.stopPropagation()
            setExpanded(!expanded)
          }}
        >
          {expanded ? '접기' : '펼치기'}
        </button>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="mt-3 space-y-2">
          {sortedCheaper.map((alt) => {
            const altPrice = extractPriceNumber(alt.price)
            const savings = currentPrice - altPrice
            const savingsPercent = Math.round((savings / currentPrice) * 100)

            return (
              <div
                key={alt.id}
                className="bg-white rounded-lg p-3 border border-amber-100 hover:border-amber-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 truncate">{alt.name}</p>
                    {alt.description && (
                      <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{alt.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 mt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-zinc-800">
                      ₩{altPrice.toLocaleString('ko-KR')}
                    </span>
                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                      ₩{savings.toLocaleString('ko-KR')} 절약 ({savingsPercent}%)
                    </span>
                  </div>
                </div>

                {alt.rating !== undefined && (
                  <div className="flex items-center gap-1 mt-1.5">
                    <span className="text-xs text-amber-600">⭐</span>
                    <span className="text-xs text-zinc-600">{alt.rating.toFixed(1)}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => onSwitch(alt)}
                  className="w-full mt-2 py-2 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  이걸로 변경 →
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
