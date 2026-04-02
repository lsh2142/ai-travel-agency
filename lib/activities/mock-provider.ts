import type { ActivityProvider, ActivitySearchParams, ActivityResult } from './types'

// 주요 도시별 mock 액티비티 데이터
const MOCK_ACTIVITIES: ActivityResult[] = [
  {
    id: 'mock-act-1',
    name: '도쿄 스시 만들기 쿠킹 클래스',
    category: 'experience',
    description: '현지 셰프에게 직접 배우는 정통 스시 & 사시미 만들기. 식재료 선택부터 플레이팅까지 2시간 코스.',
    location: '도쿄 긴자',
    duration: '2시간',
    pricePerPerson: 65000,
    currency: 'KRW',
    totalPrice: 0,
    rating: 4.8,
    reviewCount: 523,
    highlights: ['영어·한국어 안내 가능', '식재료 포함', '레시피 카드 제공', '최대 8인 소규모'],
    bookingUrl: 'https://www.viator.com/Tokyo/d334-ttd',
    available: true,
    dataSource: 'mock',
  },
  {
    id: 'mock-act-2',
    name: '아사쿠사 & 도쿄 스카이트리 반일 투어',
    category: 'tour',
    description: '도쿄의 과거와 현재를 동시에. 전통 사찰 센소지와 634m 스카이트리를 함께 즐기는 반일 가이드 투어.',
    location: '도쿄 아사쿠사',
    duration: '4시간',
    pricePerPerson: 45000,
    currency: 'KRW',
    totalPrice: 0,
    rating: 4.6,
    reviewCount: 1204,
    highlights: ['한국어 가이드', '입장료 포함', '소규모 그룹 (최대 12인)', '점심 옵션 추가 가능'],
    bookingUrl: 'https://www.klook.com/activity/tokyo-asakusa-skytree/',
    available: true,
    dataSource: 'mock',
  },
  {
    id: 'mock-act-3',
    name: '하라주쿠 스트리트 푸드 투어',
    category: 'food',
    description: '다케시타 거리부터 오모테산도까지 도쿄 팝 컬처와 먹거리를 동시에 탐방. 크레페·타코야키·모찌 등 8가지 시식.',
    location: '도쿄 하라주쿠',
    duration: '3시간',
    pricePerPerson: 55000,
    currency: 'KRW',
    totalPrice: 0,
    rating: 4.7,
    reviewCount: 318,
    highlights: ['8가지 시식 포함', '가이드 동행', '인스타그램 포토스팟 안내', '그룹 최대 10인'],
    bookingUrl: 'https://www.airbnb.co.kr/experiences/tokyo',
    available: true,
    dataSource: 'mock',
  },
  {
    id: 'mock-act-4',
    name: '후지산 당일치기 버스 투어',
    category: 'outdoor',
    description: '도쿄 출발 후지산 5합목 + 가와구치코 호수 + 오시노 핫카이 코스. 전망대에서 후지산 절경 감상.',
    location: '도쿄 → 후지산',
    duration: '종일 (12시간)',
    pricePerPerson: 95000,
    currency: 'KRW',
    totalPrice: 0,
    rating: 4.5,
    reviewCount: 2187,
    highlights: ['왕복 교통 포함', '한국어 오디오 가이드', '점심 식사 포함', '우천 환불 정책'],
    bookingUrl: 'https://www.klook.com/activity/tokyo-fuji-day-trip/',
    available: true,
    dataSource: 'mock',
  },
  {
    id: 'mock-act-5',
    name: '도쿄 국립 박물관 프리미엄 관람',
    category: 'culture',
    description: '우에노 공원 내 일본 최대 박물관. 국보급 사무라이 갑옷·도자기·불교 미술 등 2,000여 점 상설 전시.',
    location: '도쿄 우에노',
    duration: '2~3시간 (자유)',
    pricePerPerson: 18000,
    currency: 'KRW',
    totalPrice: 0,
    rating: 4.4,
    reviewCount: 876,
    highlights: ['입장권 포함', '오디오 가이드 (한국어)', '물품 보관함 제공', '기념품 할인 쿠폰'],
    bookingUrl: 'https://www.tnm.jp',
    available: true,
    dataSource: 'mock',
  },
  {
    id: 'mock-act-6',
    name: '닌텐도 테마 투어 — 시부야 & 아키하바라',
    category: 'experience',
    description: '게임 마니아를 위한 특별 코스. 닌텐도 도쿄 매장 → 포켓몬 센터 → 아키하바라 레트로 게임 샵 탐방.',
    location: '도쿄 시부야·아키하바라',
    duration: '5시간',
    pricePerPerson: 40000,
    currency: 'KRW',
    totalPrice: 0,
    rating: 4.9,
    reviewCount: 142,
    highlights: ['한국어 가이드', '한정판 굿즈 구매 가이드', '아키하바라 자유 탐방 1시간', '소규모 (최대 6인)'],
    bookingUrl: 'https://www.airbnb.co.kr/experiences/tokyo-gaming',
    available: true,
    dataSource: 'mock',
  },
]

const CITY_KEY_MAP: Record<string, boolean> = {
  '도쿄': true, '도꾜': true, 'tokyo': true,
  '오사카': true, '방콕': true, '싱가포르': true,
}

function normalizeCity(destination: string): boolean {
  const lower = destination.toLowerCase().split(/[\s,]+/)[0]
  return CITY_KEY_MAP[lower] ?? true // 기본적으로 mock 반환
}

function calcTotalPrice(pricePerPerson: number, guests: number): number {
  return pricePerPerson * Math.max(1, guests)
}

export const mockActivityProvider: ActivityProvider = {
  name: 'mock',
  async search(params: ActivitySearchParams): Promise<ActivityResult[]> {
    normalizeCity(params.destination) // 향후 도시별 데이터 분기 시 사용

    return MOCK_ACTIVITIES
      .filter((a) => {
        if (params.category && params.category !== 'all') return a.category === params.category
        if (params.maxPrice && a.pricePerPerson > params.maxPrice) return false
        return true
      })
      .map((a) => ({
        ...a,
        date: params.date ?? '',
        totalPrice: calcTotalPrice(a.pricePerPerson, params.guests ?? 2),
      }))
  },
}
