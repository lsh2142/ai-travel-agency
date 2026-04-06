import type { FlightOption } from '@/lib/flights/flight-option'

/**
 * 항공권 우선 UX: 사용자가 선택한 항공편 세션 타입
 * sessionStorage key: 'selectedFlight'
 */
export interface SelectedFlight {
  outbound: FlightOption       // 선택한 출발 항공편
  return?: FlightOption        // 귀국 항공편 (MVP: 미사용, 향후 확장)
  confirmedDates: {
    start: string              // outbound.departure.date (YYYY-MM-DD)
    end: string                // 귀국일 (날짜 picker에서 입력)
  }
}
