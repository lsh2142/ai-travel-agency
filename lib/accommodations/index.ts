import { serpapiAccommodationProvider } from './serpapi-provider'
import { mockAccommodationProvider } from './mock-provider'
import type { AccommodationProvider } from './types'

// 환경변수 SERPAPI_KEY 존재 시 → SerpAPI 프로바이더 (내부에서 mock fallback 처리)
// 없을 경우 → mock 프로바이더 직접 사용
export const accommodationProvider: AccommodationProvider =
  process.env.SERPAPI_KEY ? serpapiAccommodationProvider : mockAccommodationProvider

export { mockAccommodationProvider } from './mock-provider'
export { serpapiAccommodationProvider } from './serpapi-provider'
export type { AccommodationProvider, AccommodationSearchParams, AccommodationResult, AccommodationType, AccommodationSource } from './types'
