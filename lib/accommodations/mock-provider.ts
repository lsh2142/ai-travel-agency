import type { AccommodationProvider, AccommodationSearchParams, AccommodationResult } from './types'

// 주요 도시별 mock 숙박 데이터 (호텔 + Airbnb 혼합)
const MOCK_ACCOMMODATIONS: Record<string, AccommodationResult[]> = {
  default: [
    // ── 호텔 ──────────────────────────────────────────────
    {
      id: 'mock-hotel-1',
      name: '신주쿠 그랜드 호텔',
      type: 'hotel',
      source: 'hotel',
      location: '도쿄 신주쿠',
      checkIn: '',
      checkOut: '',
      pricePerNight: 120000,
      currency: 'KRW',
      totalPrice: 0,
      rating: 4.3,
      reviewCount: 1284,
      amenities: ['무료 Wi-Fi', '조식 포함', '피트니스', '24시 프런트'],
      bookingUrl: 'https://www.booking.com/searchresults.html?ss=%EC%8B%A0%EC%A3%BC%EC%BF%A0+%ED%98%B8%ED%85%94',
      available: true,
      dataSource: 'mock',
    },
    {
      id: 'mock-hotel-2',
      name: '아사쿠사 부티크 호텔',
      type: 'hotel',
      source: 'hotel',
      location: '도쿄 아사쿠사',
      checkIn: '',
      checkOut: '',
      pricePerNight: 95000,
      currency: 'KRW',
      totalPrice: 0,
      rating: 4.5,
      reviewCount: 876,
      amenities: ['무료 Wi-Fi', '전통 욕실', '관광지 인근'],
      bookingUrl: 'https://www.booking.com/searchresults.html?ss=%EC%95%84%EC%82%AC%EC%BF%A0%EC%82%AC+%ED%98%B8%ED%85%94',
      available: true,
      dataSource: 'mock',
    },
    {
      id: 'mock-hotel-3',
      name: '시부야 코스모스 호텔',
      type: 'hotel',
      source: 'hotel',
      location: '도쿄 시부야',
      checkIn: '',
      checkOut: '',
      pricePerNight: 140000,
      currency: 'KRW',
      totalPrice: 0,
      rating: 4.1,
      reviewCount: 632,
      amenities: ['무료 Wi-Fi', '루프탑 바', '조식 옵션', '쇼핑몰 인근'],
      bookingUrl: 'https://www.agoda.com/search?city=tokyo&checkIn=&checkOut=',
      available: true,
      dataSource: 'mock',
    },
    // ── Airbnb/숙소 ──────────────────────────────────────
    {
      id: 'mock-airbnb-1',
      name: '도쿄 타워뷰 아파트먼트',
      type: 'airbnb',
      source: 'airbnb',
      location: '도쿄 미나토구',
      checkIn: '',
      checkOut: '',
      pricePerNight: 85000,
      currency: 'KRW',
      totalPrice: 0,
      rating: 4.8,
      reviewCount: 312,
      amenities: ['독립 주방', '도쿄 타워 뷰', '세탁기', '무료 Wi-Fi'],
      bookingUrl: 'https://www.airbnb.co.kr/s/Tokyo--Japan/homes',
      available: true,
      dataSource: 'mock',
    },
    {
      id: 'mock-airbnb-2',
      name: '시모키타자와 아늑한 원룸',
      type: 'airbnb',
      source: 'airbnb',
      location: '도쿄 시모키타자와',
      checkIn: '',
      checkOut: '',
      pricePerNight: 58000,
      currency: 'KRW',
      totalPrice: 0,
      rating: 4.6,
      reviewCount: 198,
      amenities: ['독립 공간', '근처 카페 많음', '무료 Wi-Fi', '자전거 대여'],
      bookingUrl: 'https://www.airbnb.co.kr/s/Shimokitazawa--Tokyo/homes',
      available: true,
      dataSource: 'mock',
    },
    {
      id: 'mock-airbnb-3',
      name: '나카메구로 디자이너 스튜디오',
      type: 'airbnb',
      source: 'airbnb',
      location: '도쿄 나카메구로',
      checkIn: '',
      checkOut: '',
      pricePerNight: 110000,
      currency: 'KRW',
      totalPrice: 0,
      rating: 4.9,
      reviewCount: 145,
      amenities: ['인테리어 특화', '강변 산책로 인근', '주방', '무료 Wi-Fi'],
      bookingUrl: 'https://www.airbnb.co.kr/s/Nakameguro--Tokyo/homes',
      available: true,
      dataSource: 'mock',
    },
  ],
}

// 도시명 정규화 키 매핑
const CITY_KEY_MAP: Record<string, string> = {
  '도쿄': 'default', '도꾜': 'default', 'tokyo': 'default',
  '오사카': 'default', '방콕': 'default', '싱가포르': 'default',
}

function normalizeCity(destination: string): string {
  const lower = destination.toLowerCase().split(/[\s,]+/)[0]
  return CITY_KEY_MAP[lower] ?? 'default'
}

function calcTotalPrice(pricePerNight: number, checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return pricePerNight
  const nights = Math.max(
    1,
    Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86_400_000)
  )
  return pricePerNight * nights
}

export const mockAccommodationProvider: AccommodationProvider = {
  name: 'mock',
  async search(params: AccommodationSearchParams): Promise<AccommodationResult[]> {
    const key = normalizeCity(params.destination)
    const base = MOCK_ACCOMMODATIONS[key] ?? MOCK_ACCOMMODATIONS['default']

    return base
      .filter((r) => {
        if (params.type === 'hotel') return r.source === 'hotel'
        if (params.type === 'airbnb') return r.source === 'airbnb'
        return true // 'all'
      })
      .map((r) => ({
        ...r,
        checkIn: params.checkIn,
        checkOut: params.checkOut,
        totalPrice: calcTotalPrice(r.pricePerNight, params.checkIn, params.checkOut),
      }))
  },
}
