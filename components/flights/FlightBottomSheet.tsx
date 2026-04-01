'use client'

import { useState, useEffect, useCallback } from 'react'
import type { FlightOption, FlightApiResponse } from '@/lib/flights/flight-option'
import { sortFlights } from '@/lib/flights/sort-flights'
import { FlightCard } from './FlightCard'
import { FlightFilter } from './FlightFilter'
import type { FlightFilterState } from './FlightFilter'
import { FlightSkeleton } from './FlightSkeleton'

interface FlightBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  from: string
  to: string | null
  date: string | null
  returnDate?: string | null
  destination: string
}

const DEFAULT_FILTER: FlightFilterState = {
  tripType: 'roundtrip',
  timeFilter: 'all',
  classFilter: 'economy',
  sortBy: 'price',
}

function getTimeSlot(time: string): 'morning' | 'afternoon' | 'evening' {
  const hour = parseInt(time.split(':')[0], 10)
  if (hour < 12) return 'morning'
  if (hour < 18) return 'afternoon'
  return 'evening'
}

export function FlightBottomSheet({
  isOpen,
  onClose,
  from,
  to,
  date,
  returnDate,
  destination,
}: FlightBottomSheetProps) {
  const [flights, setFlights] = useState<FlightOption[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FlightFilterState>(DEFAULT_FILTER)

  const fetchFlights = useCallback(async () => {
    if (!to || !date) return
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ from, to, date })
      if (returnDate) params.set('returnDate', returnDate)
      const res = await fetch(`/api/flights?${params.toString()}`)
      if (res.status === 404) {
        setFlights([])
        return
      }
      if (!res.ok) {
        const body = await res.json() as { message?: string }
        throw new Error(body.message ?? '항공편 검색 실패')
      }
      const data = await res.json() as FlightApiResponse
      setFlights(data.outbound ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : '검색 실패, 잠시 후 재시도')
    } finally {
      setLoading(false)
    }
  }, [from, to, date, returnDate])

  useEffect(() => {
    if (isOpen) {
      setFilter(DEFAULT_FILTER)
      fetchFlights()
    }
  }, [isOpen, fetchFlights])

  // 필터 적용
  const filtered = sortFlights(
    flights.filter((f) => {
      if (f.class !== filter.classFilter) return false
      if (filter.timeFilter !== 'all' && getTimeSlot(f.departure.time) !== filter.timeFilter) return false
      return true
    }),
    filter.sortBy,
  )

  const noDate = !date
  const noIATA = !to

  if (!isOpen) return null

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        className="fixed inset-0 bg-black/40 z-40 lg:hidden"
        onClick={onClose}
      />

      {/* 패널 — 모바일: bottom sheet, PC: 우측 사이드 패널 */}
      <div
        className={[
          'fixed z-50 bg-white flex flex-col',
          // 모바일: 슬라이드업 bottom sheet (화면 75%)
          'bottom-0 left-0 right-0 rounded-t-2xl max-h-[75vh]',
          // PC: 우측 고정 사이드 패널
          'lg:bottom-0 lg:top-0 lg:left-auto lg:right-0 lg:w-80 lg:rounded-none lg:max-h-screen lg:shadow-xl',
          'transition-transform duration-300',
        ].join(' ')}
      >
        {/* 드래그 핸들 (모바일만) */}
        <div className="flex justify-center pt-3 pb-1 lg:hidden">
          <div className="w-10 h-1 rounded-full bg-zinc-300" />
        </div>

        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">✈️ 항공권 검색</h2>
            {to && date && (
              <p className="text-xs text-zinc-500 mt-0.5">
                ICN → {to} · {date}
                {returnDate && ` ~ ${returnDate}`}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-100 text-zinc-500 text-lg"
          >
            ×
          </button>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {/* 날짜 없음 */}
          {noDate && (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <p className="text-sm text-zinc-500">출발 날짜를 먼저 설정해주세요</p>
            </div>
          )}

          {/* IATA 매핑 실패 */}
          {!noDate && noIATA && (
            <div className="flex flex-col items-center justify-center h-32 text-center gap-3">
              <p className="text-sm text-zinc-500">
                &apos;{destination}&apos; 노선을 찾지 못했어요
              </p>
              <a
                href={`https://www.google.com/flights`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                Google Flights에서 직접 검색 →
              </a>
            </div>
          )}

          {/* 정상 상태 */}
          {!noDate && !noIATA && (
            <>
              <FlightFilter filter={filter} onChange={setFilter} />

              <div className="mt-3 space-y-3">
                {loading && <FlightSkeleton />}

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-sm text-red-700 mb-2">{error}</p>
                    <a
                      href="https://www.google.com/flights"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Google Flights에서 직접 검색 →
                    </a>
                  </div>
                )}

                {!loading && !error && filtered.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-24 text-center gap-2">
                    <p className="text-sm text-zinc-400">조건에 맞는 항공편이 없어요</p>
                    <button
                      type="button"
                      onClick={() => setFilter(DEFAULT_FILTER)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      필터 초기화
                    </button>
                  </div>
                )}

                {!loading && filtered.map((flight) => (
                  <FlightCard key={flight.id} flight={flight} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
