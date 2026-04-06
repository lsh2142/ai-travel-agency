'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { TravelParams } from '@/lib/types/travel'
import type { SelectedFlight } from '@/lib/types/flight-session'
import type { FlightOption, FlightApiResponse } from '@/lib/flights/flight-option'
import { getCityIATA } from '@/lib/flights/iata-map'
import { sortFlights } from '@/lib/flights/sort-flights'
import { FlightCard } from '@/components/flights/FlightCard'
import { FlightFilter } from '@/components/flights/FlightFilter'
import type { FlightFilterState } from '@/components/flights/FlightFilter'
import { FlightSkeleton } from '@/components/flights/FlightSkeleton'

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

export default function FlightSearchPage() {
  const router = useRouter()
  const [params, setParams] = useState<TravelParams | null>(null)
  const [departDate, setDepartDate] = useState('')
  const [returnDate, setReturnDate] = useState('')
  const [flights, setFlights] = useState<FlightOption[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [noResults, setNoResults] = useState(false)
  const [filter, setFilter] = useState<FlightFilterState>(DEFAULT_FILTER)
  const [selectedFlight, setSelectedFlight] = useState<FlightOption | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  // travelParams 로드
  useEffect(() => {
    const stored = sessionStorage.getItem('travelParams')
    if (!stored) { router.replace('/'); return }
    const p = JSON.parse(stored) as TravelParams
    setParams(p)
    // 기존 날짜 있으면 미리 채우기
    if (p.dates?.start) setDepartDate(p.dates.start)
    if (p.dates?.end) setReturnDate(p.dates.end)
    // 기존 선택 항공편 복원
    const prevFlight = sessionStorage.getItem('selectedFlight')
    if (prevFlight) {
      try {
        const sf = JSON.parse(prevFlight) as SelectedFlight
        setSelectedFlight(sf.outbound)
      } catch { /* 무시 */ }
    }
  }, [router])

  const destinationIATA = params
    ? (getCityIATA(params.destination.split(/[\s,와과]+/)[0].trim()) ?? null)
    : null

  const searchFlights = useCallback(async () => {
    if (!destinationIATA || !departDate) return
    setLoading(true)
    setError(null)
    setNoResults(false)
    setFlights([])
    setHasSearched(true)
    try {
      const qs = new URLSearchParams({ from: 'ICN', to: destinationIATA, date: departDate })
      if (returnDate) qs.set('returnDate', returnDate)
      const res = await fetch(`/api/flights?${qs}`)
      if (res.status === 404) { setNoResults(true); return }
      if (!res.ok) throw new Error(`항공편 검색 실패 (${res.status})`)
      const data = await res.json() as FlightApiResponse
      setFlights(data.outbound ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : '검색 실패')
    } finally {
      setLoading(false)
    }
  }, [destinationIATA, departDate, returnDate])

  // 필터 적용
  const filtered = sortFlights(
    flights.filter((f) => {
      if (f.class !== filter.classFilter) return false
      if (filter.timeFilter !== 'all' && getTimeSlot(f.departure.time) !== filter.timeFilter) return false
      return true
    }),
    filter.sortBy,
  )

  function handleSelectFlight(flight: FlightOption) {
    setSelectedFlight((prev) => prev?.id === flight.id ? null : flight)
  }

  function handleConfirm() {
    if (!selectedFlight || !params) return
    const start = departDate || selectedFlight.departure.date || ''
    const end = returnDate || start
    const sf: SelectedFlight = {
      outbound: { ...selectedFlight, departure: { ...selectedFlight.departure, date: start } },
      confirmedDates: { start, end },
    }
    sessionStorage.setItem('selectedFlight', JSON.stringify(sf))
    // travelParams 날짜 업데이트
    const updated: TravelParams = { ...params, dates: { start, end } }
    sessionStorage.setItem('travelParams', JSON.stringify(updated))
    sessionStorage.removeItem('tripPlan') // 날짜 바뀌면 이전 캐시 무효화
    router.push('/plan')
  }

  function handleSkip() {
    // 날짜 입력된 경우 적용하고 진행
    if (params && departDate) {
      const end = returnDate || departDate
      const updated: TravelParams = { ...params, dates: { start: departDate, end } }
      sessionStorage.setItem('travelParams', JSON.stringify(updated))
      sessionStorage.removeItem('tripPlan')
    }
    router.push('/plan')
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="min-h-screen bg-zinc-50 pb-32">
      {/* 서브 네비 */}
      <nav className="bg-white border-b border-zinc-200 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button onClick={() => router.back()} className="text-sm text-zinc-500 hover:text-zinc-800">
            ← 뒤로
          </button>
          <h1 className="text-base font-semibold text-zinc-900">✈️ 항공권 선택</h1>
          <button onClick={handleSkip} className="text-sm text-blue-600 hover:underline">
            건너뛰기
          </button>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* 노선 + 날짜 선택 */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-zinc-700">
            <span className="px-2 py-1 bg-zinc-100 rounded-lg text-xs font-mono">ICN</span>
            <span className="text-zinc-400">→</span>
            <span className="px-2 py-1 bg-zinc-100 rounded-lg text-xs font-mono">
              {destinationIATA ?? params?.destination ?? '...'}
            </span>
            {!destinationIATA && params && (
              <span className="text-xs text-amber-600">IATA 코드 없음 — 직접 검색 필요</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">📅 출발일</label>
              <input
                type="date"
                value={departDate}
                min={today}
                onChange={(e) => setDepartDate(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">📅 귀국일</label>
              <input
                type="date"
                value={returnDate}
                min={departDate || today}
                onChange={(e) => setReturnDate(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="button"
            disabled={!departDate || !destinationIATA}
            onClick={searchFlights}
            className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            항공편 검색
          </button>

          {!destinationIATA && params && (
            <p className="text-xs text-zinc-500 text-center">
              &apos;{params.destination}&apos;에 대한 IATA 코드를 찾을 수 없습니다.{' '}
              <a
                href="https://www.google.com/flights"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Google Flights에서 직접 검색 →
              </a>
            </p>
          )}
        </div>

        {/* 결과 */}
        {hasSearched && (
          <div className="space-y-3">
            <FlightFilter filter={filter} onChange={setFilter} />

            {loading && <FlightSkeleton />}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {!loading && noResults && (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                <p className="text-2xl">✈️</p>
                <p className="text-sm font-medium text-zinc-700">직항 항공편 정보가 없습니다</p>
                <p className="text-xs text-zinc-400">ICN → {destinationIATA} 노선을 준비 중이에요</p>
                <a
                  href={`https://www.google.com/flights#flt=ICN.${destinationIATA}.${departDate};c:KRW`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Google Flights에서 직접 검색 →
                </a>
                <button
                  onClick={handleSkip}
                  className="text-sm text-zinc-500 hover:underline mt-1"
                >
                  날짜만 설정하고 일정 만들기 →
                </button>
              </div>
            )}

            {!loading && !error && filtered.length === 0 && flights.length > 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
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
              <FlightCard
                key={flight.id}
                flight={flight}
                onSelect={handleSelectFlight}
                selectedId={selectedFlight?.id}
              />
            ))}
          </div>
        )}
      </main>

      {/* 하단 고정 CTA — 항공편 선택 시 활성화 */}
      {selectedFlight && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 px-4 py-4 z-20">
          <div className="max-w-2xl mx-auto space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-500 px-1">
              <span>
                {selectedFlight.airline} {selectedFlight.flightNumber} ·{' '}
                {selectedFlight.departure.time} ICN → {selectedFlight.arrival.airport}
              </span>
              <span className="font-semibold text-zinc-900">
                ₩ {selectedFlight.price.toLocaleString('ko-KR')}~
              </span>
            </div>
            <button
              type="button"
              onClick={handleConfirm}
              className="w-full py-3 bg-blue-600 text-white rounded-xl text-base font-semibold hover:bg-blue-700 transition-colors"
            >
              이 항공편으로 일정 만들기 →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
