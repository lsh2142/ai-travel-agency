// 액티비티 / 투어 / 체험 Provider 패턴 인터페이스

export type ActivityCategory =
  | 'tour'         // 가이드 투어
  | 'experience'   // 체험 (쿠킹클래스, 도예 등)
  | 'outdoor'      // 야외 활동 (하이킹, 서핑 등)
  | 'culture'      // 문화·박물관·공연
  | 'food'         // 음식 투어·식도락
  | 'transport'    // 이동 수단 (렌터카, 버스 투어)
  | 'other'

export interface ActivitySearchParams {
  destination: string     // 도시명 또는 지역
  date?: string           // YYYY-MM-DD (시작일 기준)
  guests?: number         // 인원 수 (기본 2)
  category?: ActivityCategory | 'all'
  maxPrice?: number       // 1인당 최대 가격 (KRW)
}

export interface ActivityResult {
  id: string
  name: string
  category: ActivityCategory
  description: string
  location: string
  date?: string
  duration?: string           // 예: "2시간", "반일", "종일"
  pricePerPerson: number
  currency: string
  totalPrice: number          // pricePerPerson * guests
  rating?: number
  reviewCount?: number
  highlights?: string[]
  bookingUrl?: string
  thumbnailUrl?: string
  available: boolean
  dataSource: 'serpapi' | 'viator' | 'mock'
}

export interface ActivityProvider {
  name: string
  search(params: ActivitySearchParams): Promise<ActivityResult[]>
}
