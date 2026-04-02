import type { AccommodationProvider, AccommodationSearchParams, AccommodationResult } from './types'
import { mockAccommodationProvider } from './mock-provider'

// SerpAPI Google Hotels 기반 숙박 검색
// SERPAPI_KEY 환경변수가 없으면 mock 으로 fallback

const SERPAPI_KEY = process.env.SERPAPI_KEY

interface SerpApiHotelsResponse {
  hotels_results?: SerpApiHotel[]
  properties?: SerpApiHotel[]
  error?: string
}

interface SerpApiHotel {
  name?: string
  type?: string
  description?: string
  gps_coordinates?: { latitude: number; longitude: number }
  check_in_time?: string
  check_out_time?: string
  rate_per_night?: { lowest?: string; extracted_lowest?: number }
  total_rate?: { lowest?: string; extracted_lowest?: number }
  overall_rating?: number
  reviews?: number
  amenities?: string[]
  link?: string
  thumbnail?: string
  hotel_class?: string
  nearby_places?: { name: string; transportations?: { type: string; duration: string }[] }[]
}

function parsePrice(raw: string | undefined): number {
  if (!raw) return 0
  // "₩120,000" → 120000
  return parseInt(raw.replace(/[^0-9]/g, ''), 10) || 0
}

function toAccommodationResult(hotel: SerpApiHotel, idx: number, params: AccommodationSearchParams): AccommodationResult {
  const pricePerNight = hotel.rate_per_night?.extracted_lowest
    ?? parsePrice(hotel.rate_per_night?.lowest)
    ?? 0

  const totalPrice = hotel.total_rate?.extracted_lowest
    ?? parsePrice(hotel.total_rate?.lowest)
    ?? pricePerNight

  return {
    id: `serpapi-hotel-${idx}`,
    name: hotel.name ?? '이름 없음',
    type: 'hotel',
    source: 'hotel',
    location: params.destination,
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    pricePerNight,
    currency: 'KRW',
    totalPrice,
    rating: hotel.overall_rating,
    reviewCount: hotel.reviews,
    amenities: hotel.amenities?.slice(0, 6) ?? [],
    bookingUrl: hotel.link ?? `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(params.destination)}`,
    thumbnailUrl: hotel.thumbnail,
    available: true,
    dataSource: 'serpapi',
  }
}

export const serpapiAccommodationProvider: AccommodationProvider = {
  name: 'serpapi',
  async search(params: AccommodationSearchParams): Promise<AccommodationResult[]> {
    if (!SERPAPI_KEY) {
      console.warn('[AccommodationProvider] SERPAPI_KEY not set — falling back to mock')
      return mockAccommodationProvider.search(params)
    }

    try {
      const query = new URLSearchParams({
        engine: 'google_hotels',
        q: `${params.destination} hotel`,
        check_in_date: params.checkIn,
        check_out_date: params.checkOut,
        adults: String(params.guests ?? 2),
        rooms: String(params.rooms ?? 1),
        currency: 'KRW',
        hl: 'ko',
        gl: 'kr',
        api_key: SERPAPI_KEY,
      })

      const res = await fetch(`https://serpapi.com/search?${query.toString()}`, {
        next: { revalidate: 3600 }, // 1시간 캐시
      })

      if (!res.ok) throw new Error(`SerpAPI HTTP ${res.status}`)

      const data: SerpApiHotelsResponse = await res.json()

      if (data.error) throw new Error(`SerpAPI error: ${data.error}`)

      const hotels = (data.hotels_results ?? data.properties ?? []).slice(0, 9)

      if (hotels.length === 0) {
        console.warn('[AccommodationProvider] SerpAPI returned 0 results — falling back to mock')
        return mockAccommodationProvider.search(params)
      }

      const results = hotels.map((h, i) => toAccommodationResult(h, i, params))

      // type 필터링
      return results.filter((r) => {
        if (params.type === 'airbnb') return false // SerpAPI Hotels는 hotel만
        return true
      })
    } catch (err) {
      console.error('[AccommodationProvider] SerpAPI failed, falling back to mock:', err)
      return mockAccommodationProvider.search(params)
    }
  },
}
