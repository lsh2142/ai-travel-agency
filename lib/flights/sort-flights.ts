import type { FlightOption } from './flight-option'

export type SortOption = 'price' | 'departure' | 'duration'

export function sortFlights(flights: FlightOption[], by: SortOption = 'price'): FlightOption[] {
  return [...flights].sort((a, b) => {
    if (by === 'price') {
      // 1순위: 직항 우선
      if (a.stops !== b.stops) return a.stops - b.stops
      // 2순위: 가격 낮은 순
      return a.price - b.price
    }
    if (by === 'departure') {
      // 1순위: 직항 우선
      if (a.stops !== b.stops) return a.stops - b.stops
      // 2순위: 출발 시간 오전 우선
      const aHour = parseInt(a.departure.time.split(':')[0], 10)
      const bHour = parseInt(b.departure.time.split(':')[0], 10)
      return aHour - bHour
    }
    if (by === 'duration') {
      return a.duration - b.duration
    }
    return 0
  })
}

/** 기본 정렬: 직항 우선 → 오전 출발 우선 → 최저가 순 */
export function sortFlightsDefault(flights: FlightOption[]): FlightOption[] {
  return [...flights].sort((a, b) => {
    if (a.stops !== b.stops) return a.stops - b.stops
    const aHour = parseInt(a.departure.time.split(':')[0], 10)
    const bHour = parseInt(b.departure.time.split(':')[0], 10)
    if (aHour !== bHour) return aHour - bHour
    return a.price - b.price
  })
}
