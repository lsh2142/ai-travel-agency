// 숙박 Provider 패턴 인터페이스 — hotel + airbnb/vacation_rental 확장

export type AccommodationType = 'hotel' | 'ryokan' | 'guesthouse' | 'airbnb' | 'vacation_rental' | 'other'
export type AccommodationSource = 'hotel' | 'airbnb'  // 탭 분류 키

export interface AccommodationSearchParams {
  destination: string         // 도시명 또는 지역
  checkIn: string             // YYYY-MM-DD
  checkOut: string            // YYYY-MM-DD
  guests?: number             // 기본 2
  rooms?: number              // 기본 1
  maxPrice?: number           // 최대 1박 가격 (KRW)
  type?: 'hotel' | 'airbnb' | 'all'  // 기본 all
}

export interface AccommodationResult {
  id: string
  name: string
  type: AccommodationType
  source: AccommodationSource  // 탭 분류 ('hotel' | 'airbnb')
  location: string
  checkIn: string
  checkOut: string
  pricePerNight: number
  currency: string
  totalPrice: number
  rating?: number
  reviewCount?: number
  amenities?: string[]
  bookingUrl?: string
  thumbnailUrl?: string
  available: boolean
  dataSource: 'serpapi' | 'mock'
}

export interface AccommodationProvider {
  name: string
  search(params: AccommodationSearchParams): Promise<AccommodationResult[]>
}
