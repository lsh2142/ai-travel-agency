import type { ActivityProvider, ActivitySearchParams, ActivityResult, ActivityCategory } from './types'
import { mockActivityProvider } from './mock-provider'

const SERPAPI_KEY = process.env.SERPAPI_KEY

interface SerpApiEventsResponse {
  events_results?: SerpApiEvent[]
  error?: string
}

interface SerpApiEvent {
  title?: string
  description?: string
  date?: { start_date?: string; when?: string }
  address?: string[]
  link?: string
  thumbnail?: string
  ticket_info?: { source?: string; link?: string; link_type?: string }[]
  venue?: { name?: string; rating?: number; reviews?: number }
}

function guessCategory(title: string = '', description: string = ''): ActivityCategory {
  const text = `${title} ${description}`.toLowerCase()
  if (/쿠킹|요리|cooking|sushi|ramen/.test(text)) return 'experience'
  if (/투어|tour|가이드/.test(text)) return 'tour'
  if (/하이킹|등산|surf|outdoor|자전거/.test(text)) return 'outdoor'
  if (/박물관|museum|갤러리|gallery|공연|concert/.test(text)) return 'culture'
  if (/맛집|food|먹거리|식도락/.test(text)) return 'food'
  return 'other'
}

function toActivityResult(event: SerpApiEvent, idx: number, params: ActivitySearchParams): ActivityResult {
  const category = guessCategory(event.title, event.description)
  const pricePerPerson = 0 // SerpAPI 이벤트는 가격 정보 없음 → 0으로 표시

  return {
    id: `serpapi-event-${idx}`,
    name: event.title ?? '이름 없음',
    category,
    description: event.description ?? '',
    location: event.address?.[0] ?? params.destination,
    date: event.date?.start_date ?? params.date,
    duration: event.date?.when,
    pricePerPerson,
    currency: 'KRW',
    totalPrice: 0,
    rating: event.venue?.rating,
    reviewCount: event.venue?.reviews,
    highlights: [],
    bookingUrl: event.ticket_info?.[0]?.link ?? event.link,
    thumbnailUrl: event.thumbnail,
    available: true,
    dataSource: 'serpapi',
  }
}

export const serpapiActivityProvider: ActivityProvider = {
  name: 'serpapi',
  async search(params: ActivitySearchParams): Promise<ActivityResult[]> {
    if (!SERPAPI_KEY) {
      console.warn('[ActivityProvider] SERPAPI_KEY not set — falling back to mock')
      return mockActivityProvider.search(params)
    }

    try {
      const query = new URLSearchParams({
        engine: 'google_events',
        q: `${params.destination} activities tours`,
        hl: 'ko',
        gl: 'kr',
        api_key: SERPAPI_KEY,
      })

      if (params.date) query.set('htichips', `date:${params.date}`)

      const res = await fetch(`https://serpapi.com/search?${query.toString()}`, {
        next: { revalidate: 3600 },
      })

      if (!res.ok) throw new Error(`SerpAPI HTTP ${res.status}`)

      const data: SerpApiEventsResponse = await res.json()

      if (data.error) throw new Error(`SerpAPI error: ${data.error}`)

      const events = (data.events_results ?? []).slice(0, 8)

      if (events.length === 0) {
        console.warn('[ActivityProvider] SerpAPI returned 0 events — falling back to mock')
        return mockActivityProvider.search(params)
      }

      const results = events.map((e, i) => toActivityResult(e, i, params))

      return results.filter((r) => {
        if (params.category && params.category !== 'all') return r.category === params.category
        return true
      })
    } catch (err) {
      console.error('[ActivityProvider] SerpAPI failed, falling back to mock:', err)
      return mockActivityProvider.search(params)
    }
  },
}
