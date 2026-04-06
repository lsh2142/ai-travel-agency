'use client'

import { useState, useEffect } from 'react'
import type { RentalCarResult, CarCategory } from '@/lib/rental-cars/types'

interface RentalCarSectionProps {
  destination: string
  pickupDate: string
  returnDate: string
  passengers?: number
}

const CATEGORY_LABELS: Record<CarCategory, string> = {
  compact: '소형',
  sedan: '세단',
  suv: 'SUV',
  minivan: '미니밴',
  luxury: '럭셔리',
}

const CATEGORY_EMOJI: Record<CarCategory, string> = {
  compact: '🚗',
  sedan: '🚙',
  suv: '🛻',
  minivan: '🚐',
  luxury: '💎',
}

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating)
  const half = rating - full >= 0.5
  return (
    <span className="text-xs text-amber-500">
      {'★'.repeat(full)}{half ? '½' : ''}
      <span className="text-zinc-400 ml-0.5">({rating.toFixed(1)})</span>
    </span>
  )
}

export default function RentalCarSection({
  destination,
  pickupDate,
  returnDate,
  passengers,
}: RentalCarSectionProps) {
  const [cars, setCars] = useState<RentalCarResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<CarCategory | 'all'>('all')

  useEffect(() => {
    if (!destination || !pickupDate || !returnDate) return
    let cancelled = false
    setLoading(true)
    setError(null)

    const params = new URLSearchParams({
      destination,
      pickupDate,
      returnDate,
      ...(passengers ? { passengers: String(passengers) } : {}),
    })

    fetch(`/api/rental-cars?${params}`)
      .then((r) => r.json())
      .then((data: { results?: RentalCarResult[]; error?: string }) => {
        if (cancelled) return
        if (data.error) { setError(data.error); return }
        setCars(data.results ?? [])
      })
      .catch(() => { if (!cancelled) setError('렌터카 정보를 불러오지 못했습니다') })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [destination, pickupDate, returnDate, passengers])

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-zinc-200 p-4 animate-pulse">
        <div className="h-4 bg-zinc-100 rounded w-1/4 mb-3" />
        <div className="space-y-3">
          <div className="h-24 bg-zinc-100 rounded-xl" />
          <div className="h-24 bg-zinc-100 rounded-xl" />
        </div>
      </div>
    )
  }

  if (error || cars.length === 0) {
    return null
  }

  // 카테고리 탭 목록 (실제 존재하는 카테고리만)
  const availableCategories = Array.from(new Set(cars.map((c) => c.category)))

  const filtered = activeCategory === 'all' ? cars : cars.filter((c) => c.category === activeCategory)

  // 총 일수 계산
  const days = Math.max(
    1,
    Math.round((new Date(returnDate).getTime() - new Date(pickupDate).getTime()) / (1000 * 60 * 60 * 24))
  )

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 border-b border-zinc-100">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-900">🚗 렌터카 추천</h3>
          <span className="text-xs text-zinc-400">{destination} · {days}일</span>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1 px-4 pt-3 pb-1 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveCategory('all')}
          className={`flex-none px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            activeCategory === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
          }`}
        >
          전체
        </button>
        {availableCategories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`flex-none px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              activeCategory === cat
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            {CATEGORY_EMOJI[cat]} {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Car Cards */}
      <div className="p-4 space-y-3">
        {filtered.map((car) => (
          <div
            key={car.id}
            className="border border-zinc-200 rounded-xl p-4 hover:border-zinc-300 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              {/* Vendor logo placeholder + info */}
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="flex-none w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center text-sm font-bold text-zinc-600">
                  {car.vendorLogoText}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-zinc-900 truncate">{car.carName}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{car.vendor}</p>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                      car.transmission === 'auto'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {car.transmission === 'auto' ? '오토' : '수동'}
                    </span>
                    <span className="text-xs text-zinc-400">👥 {car.seats}인</span>
                    <span className="text-xs text-zinc-400">{CATEGORY_EMOJI[car.category]} {CATEGORY_LABELS[car.category]}</span>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="text-right flex-none">
                <p className="text-base font-bold text-zinc-900">
                  ₩{car.totalPrice.toLocaleString('ko-KR')}
                </p>
                <p className="text-xs text-zinc-400">{days}일 합계</p>
                <p className="text-xs text-zinc-500">일 ₩{car.pricePerDay.toLocaleString('ko-KR')}~</p>
              </div>
            </div>

            {/* Pickup location */}
            <p className="mt-2 text-xs text-zinc-500 flex items-center gap-1">
              <span>📍</span> {car.pickupLocation}
            </p>

            {/* Features */}
            {car.features.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {car.features.map((f) => (
                  <span key={f} className="text-xs bg-zinc-50 border border-zinc-200 text-zinc-600 px-2 py-0.5 rounded-full">
                    {f}
                  </span>
                ))}
              </div>
            )}

            {/* Rating */}
            {car.rating && (
              <div className="mt-2 flex items-center gap-1">
                <StarRating rating={car.rating} />
                {car.reviewCount && (
                  <span className="text-xs text-zinc-400">리뷰 {car.reviewCount.toLocaleString()}건</span>
                )}
              </div>
            )}

            {/* Booking Button */}
            <a
              href={car.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block w-full py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium text-center hover:bg-zinc-700 transition-colors"
            >
              예약하러 가기 →
            </a>
          </div>
        ))}
      </div>

      <p className="px-4 pb-3 text-xs text-zinc-400">
        * 가격은 참고용이며 실제 예약 시 변동될 수 있습니다
      </p>
    </div>
  )
}
