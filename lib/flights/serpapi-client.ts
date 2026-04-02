import type { FlightOption } from './flight-option'
import { buildGoogleFlightsUrl } from './booking-url'
import { getMockFlights } from '@/lib/mock/flights'

// SerpAPI 응답 타입 (필요 필드만)
interface SerpFlight {
  departure_airport: { id: string; time: string }
  arrival_airport: { id: string; time: string }
  duration: number
  airline: string
  flight_number: string
  travel_class?: string
}

interface SerpFlightGroup {
  flights: SerpFlight[]
  total_duration: number
  price: number
  booking_token?: string
}

interface SerpApiResponse {
  best_flights?: SerpFlightGroup[]
  other_flights?: SerpFlightGroup[]
  error?: string
}

// "2026-04-10 09:00" → { date: "2026-04-10", time: "09:00" }
function splitDateTime(datetime: string): { date: string; time: string } {
  const idx = datetime.indexOf(' ')
  if (idx === -1) return { date: datetime, time: '' }
  return { date: datetime.slice(0, idx), time: datetime.slice(idx + 1) }
}

function toFlightOption(
  group: SerpFlightGroup,
  outboundDate: string,
  returnDate?: string,
): FlightOption {
  const first = group.flights[0]
  const last = group.flights[group.flights.length - 1]

  const dep = splitDateTime(first.departure_airport.time)
  const arr = splitDateTime(last.arrival_airport.time)
  const origin = first.departure_airport.id
  const destination = last.arrival_airport.id
  const flightNumber = first.flight_number.replace(/\s+/g, '-')

  const isBusiness =
    first.travel_class?.toLowerCase().includes('business') ||
    first.travel_class?.toLowerCase().includes('first') ||
    false

  const bookingUrl = group.booking_token
    ? `https://www.google.com/flights?token=${group.booking_token}`
    : buildGoogleFlightsUrl(origin, destination, dep.date || outboundDate, returnDate)

  return {
    id: `${flightNumber}-${origin}-${destination}`,
    airline: first.airline,
    flightNumber,
    departure: {
      airport: origin,
      time: dep.time,
      date: dep.date || outboundDate,
    },
    arrival: {
      airport: destination,
      time: arr.time,
      date: arr.date || outboundDate,
    },
    duration: group.total_duration,
    stops: group.flights.length - 1,
    price: group.price,
    class: isBusiness ? 'business' : 'economy',
    bookingUrl,
  }
}

/**
 * SerpAPI Google Flights로 항공편 검색.
 * SERPAPI_API_KEY 환경변수가 없으면 mock 데이터로 fallback.
 */
export async function fetchFlights(
  from: string,
  to: string,
  date: string,
  returnDate?: string,
): Promise<FlightOption[]> {
  const apiKey = process.env.SERPAPI_API_KEY

  if (!apiKey) {
    console.warn('[serpapi-client] SERPAPI_API_KEY not set — using mock data')
    return getMockFlights(from, to, date)
  }

  const params = new URLSearchParams({
    engine: 'google_flights',
    departure_id: from,
    arrival_id: to,
    outbound_date: date,
    currency: 'KRW',
    hl: 'ko',
    api_key: apiKey,
    type: returnDate ? '1' : '2',
  })

  if (returnDate) {
    params.set('return_date', returnDate)
  }

  let data: SerpApiResponse
  try {
    const res = await fetch(`https://serpapi.com/search.json?${params.toString()}`)
    if (!res.ok) {
      console.error(`[serpapi-client] HTTP ${res.status} — falling back to mock`)
      return getMockFlights(from, to, date)
    }
    data = (await res.json()) as SerpApiResponse
  } catch (err) {
    console.error('[serpapi-client] fetch error — falling back to mock', err)
    return getMockFlights(from, to, date)
  }

  if (data.error) {
    console.error(`[serpapi-client] API error: ${data.error} — falling back to mock`)
    return getMockFlights(from, to, date)
  }

  const groups = [...(data.best_flights ?? []), ...(data.other_flights ?? [])]
  if (groups.length === 0) {
    console.warn('[serpapi-client] empty results — falling back to mock')
    return getMockFlights(from, to, date)
  }

  return groups
    .filter((g) => g.flights?.length > 0)
    .slice(0, 10)
    .map((g) => toFlightOption(g, date, returnDate))
}
