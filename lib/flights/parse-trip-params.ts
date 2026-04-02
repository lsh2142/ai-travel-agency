import type { TravelParams } from '@/lib/types/travel'
import { getCityIATA } from './iata-map'

export interface FlightParams {
  from: string
  to: string | null
  date: string | null
  returnDate: string | null
}

export function parseTripToFlightParams(params: TravelParams): FlightParams {
  const rawDestination = params.destination ?? ''
  // "도쿄 3박4일" → "도쿄", "오사카와 교토" → "오사카"
  const cityName = rawDestination.split(/[\s,와과]+/)[0].trim()
  const toIATA = getCityIATA(cityName)

  return {
    from: 'ICN',
    to: toIATA,
    date: params.dates?.start ?? null,
    returnDate: params.dates?.end ?? null,
  }
}
