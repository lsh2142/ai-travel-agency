'use client'

import type { FlightOption } from '@/lib/flights/flight-option'

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}시간 ${m}분` : `${h}시간`
}

function formatPrice(price: number): string {
  return `₩ ${price.toLocaleString('ko-KR')}~`
}

interface FlightCardProps {
  flight: FlightOption
}

export function FlightCard({ flight }: FlightCardProps) {
  const isDirectFlight = flight.stops === 0

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-4 space-y-3">
      {/* 상단: 항공사 + 편명 + 직항 뱃지 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">🛫</span>
          <span className="text-sm font-semibold text-zinc-900">{flight.airline}</span>
          <span className="text-xs text-zinc-400">{flight.flightNumber}</span>
        </div>
        {isDirectFlight ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
            직항 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
            {flight.stops}회 경유 <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
          </span>
        )}
      </div>

      {/* 중앙: 출발-도착 타임라인 */}
      <div className="flex items-center gap-2">
        <div className="text-center min-w-[48px]">
          <p className="text-lg font-bold text-zinc-900 leading-none">{flight.departure.time}</p>
          <p className="text-xs text-zinc-500 mt-0.5">{flight.departure.airport}</p>
        </div>

        <div className="flex-1 flex flex-col items-center gap-0.5">
          <p className="text-xs text-zinc-400">{formatDuration(flight.duration)}</p>
          <div className="w-full flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 flex-none" />
            <div className="flex-1 h-px bg-zinc-300" />
            {flight.stops > 0 && (
              <>
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-none" />
                <div className="flex-1 h-px bg-zinc-300" />
              </>
            )}
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 flex-none" />
          </div>
          {flight.stops === 0 && (
            <p className="text-xs text-zinc-400">직항</p>
          )}
        </div>

        <div className="text-center min-w-[48px]">
          <p className="text-lg font-bold text-zinc-900 leading-none">{flight.arrival.time}</p>
          <p className="text-xs text-zinc-500 mt-0.5">{flight.arrival.airport}</p>
        </div>
      </div>

      {/* 하단: 좌석 등급 + 가격 */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500">
          {flight.class === 'economy' ? '이코노미' : '비즈니스'}
        </span>
        <span className="text-base font-bold text-zinc-900">{formatPrice(flight.price)}</span>
      </div>

      {/* CTA 버튼 */}
      <div className="flex gap-2 pt-1">
        <a
          href={flight.bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
        >
          Google Flights에서 예약 <span className="text-xs">↗</span>
        </a>
        {flight.airlineUrl && (
          <a
            href={flight.airlineUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-none px-3 py-2.5 border border-zinc-300 text-zinc-700 text-sm font-medium rounded-xl hover:bg-zinc-50 transition-colors"
          >
            항공사 직접 예약
          </a>
        )}
      </div>
    </div>
  )
}
