import type { TravelParams, TripDay, TripDayItem, Alternative, BookingItem, TripPlan } from '@/lib/types/travel'

// ─── 공통 헬퍼 ───────────────────────────────────────────────────────────────

function alt(
  id: string,
  name: string,
  description: string,
  price: string,
  rating: number,
  bookingUrl: string,
  category: Alternative['category'],
): Alternative {
  return { id, name, description, price, rating, bookingUrl, category }
}

// ─── 도쿄 3박 4일 목업 ────────────────────────────────────────────────────────

export const MOCK_PARAMS: TravelParams = {
  destination: '도쿄',
  people: 2,
  dates: { start: '2026-05-01', end: '2026-05-04' },
  themes: ['관광', '맛집', '쇼핑'],
  freeText: '도쿄 도심 위주로, 대중교통으로 이동 가능한 동선',
}

const tokyoAccommodationAlts: Alternative[] = [
  alt('acc1-a', '신주쿠 그랜드 호텔', '신주쿠 역 도보 5분. 조식 포함. 넓은 트윈룸', '₩180,000/박', 4.5, 'https://www.booking.com/search?ss=shinjuku+grand+hotel', 'accommodation'),
  alt('acc1-b', '아사쿠사 뷰 호텔', '스카이트리 뷰. 전통 하이카이 데코. 온천 시설 완비', '₩220,000/박', 4.7, 'https://www.booking.com/search?ss=asakusa+view+hotel', 'accommodation'),
  alt('acc1-c', 'Airbnb 시부야 아파트', '시부야 역 3분. 주방 완비 2베드룸. 슈퍼호스트', '₩150,000/박', 4.4, 'https://www.airbnb.com/s/Shibuya--Tokyo', 'accommodation'),
]

const akihabaraAlts: Alternative[] = [
  alt('act-akb-a', '아키하바라 일렉트릭 타운 투어', '가이드와 함께 전자상가·피규어샵 탐방 2시간', '₩35,000/인', 4.3, 'https://www.klook.com/activity/akihabara', 'activity'),
  alt('act-akb-b', 'teamLab Borderless 입장권', '디지털 아트 뮤지엄. 온라인 예약 필수', '₩45,000/인', 4.9, 'https://www.klook.com/activity/teamlab-borderless', 'activity'),
  alt('act-akb-c', '도쿄 스카이트리 전망대', '지상 350m 전망. 스카이 카페 포함', '₩30,000/인', 4.6, 'https://www.klook.com/activity/tokyo-skytree', 'activity'),
]

const ramenAlts: Alternative[] = [
  alt('rest-r1-a', '이치란 라멘 신주쿠점', '개인 칸막이석. 농후 톤코츠. 24시간 영업', '₩15,000/인', 4.8, 'https://www.google.com/maps/search/ichiran+ramen+shinjuku', 'restaurant'),
  alt('rest-r1-b', '후쿠오카 잇페이 라멘', '규슈 직송 재료. 모짜렐라 교자 세트 추천', '₩18,000/인', 4.6, 'https://www.google.com/maps/search/fukuoka+ippei+ramen+tokyo', 'restaurant'),
  alt('rest-r1-c', '무조류 하나다코 츠케멘', '줄 서는 맛집. 오픈 30분 전 도착 권장', '₩16,000/인', 4.7, 'https://www.google.com/maps/search/tsukemen+tokyo', 'restaurant'),
]

const sushiAlts: Alternative[] = [
  alt('rest-s1-a', '스시로 시부야점 (회전초밥)', '100엔~ 회전초밥. 앱 웨이팅 가능', '₩25,000/인', 4.4, 'https://www.google.com/maps/search/sushiro+shibuya', 'restaurant'),
  alt('rest-s1-b', '오마카세 스시 긴자 카운터', '셰프 코스 12피스. 예약 필수 (2주 전)', '₩120,000/인', 4.9, 'https://www.tablecheck.com/shops/ginza-sushi', 'restaurant'),
  alt('rest-s1-c', '네무로 하나마루 유락초점', '홋카이도 직송 재료. 런치 합리적 가격', '₩40,000/인', 4.7, 'https://www.google.com/maps/search/nemuro-hanamaru-yurakucho', 'restaurant'),
]

const harajukuAlts: Alternative[] = [
  alt('act-hrj-a', '메이지 신궁 + 하라주쿠 도보 투어', '숲속 산책 1시간 → 다케시타 거리 쇼핑', '무료', 4.5, 'https://www.viator.com/tours/Tokyo/meiji-shrine-tour', 'activity'),
  alt('act-hrj-b', '오다이바 어뮤즈먼트 파크', '유니콘 건담 + 다이버시티 도쿄 쇼핑몰', '₩10,000/인', 4.2, 'https://www.klook.com/activity/odaiba-tokyo', 'activity'),
  alt('act-hrj-c', '아오야마 골목 갤러리 투어', '독립 아트 갤러리 5곳 큐레이팅 투어', '₩20,000/인', 4.4, 'https://www.viator.com/tours/Tokyo/aoyama-art-tour', 'activity'),
]

const day2AccAlts: Alternative[] = [
  alt('acc2-a', '신주쿠 그랜드 호텔 (연박)', '동일 숙소 연박 할인 5% 적용', '₩171,000/박', 4.5, 'https://www.booking.com/search?ss=shinjuku+grand+hotel', 'accommodation'),
  alt('acc2-b', '도쿄 스테이 아파트 시부야', '세탁기·주방 완비. 3박 이상 할인', '₩160,000/박', 4.3, 'https://www.booking.com/search?ss=tokyo+stay+shibuya', 'accommodation'),
  alt('acc2-c', '하라주쿠 부티크 호텔', '하라주쿠 역 바로 앞. 디자이너 인테리어', '₩200,000/박', 4.6, 'https://www.booking.com/search?ss=harajuku+boutique+hotel', 'accommodation'),
]

const nikkoAlts: Alternative[] = [
  alt('act-nikko-a', '닛코 동조궁 당일치기 투어', '버스+가이드 포함. 도쿄 출발 08:00', '₩90,000/인', 4.8, 'https://www.klook.com/activity/nikko-day-trip', 'activity'),
  alt('act-nikko-b', '요코하마 차이나타운 반일 투어', '차이나타운 + 야마시타 공원 + 미라이 지구', '₩40,000/인', 4.5, 'https://www.klook.com/activity/yokohama-tour', 'activity'),
  alt('act-nikko-c', '가마쿠라 대불 + 에노시마 투어', '도보 가능 코스. 해산물 덮밥 런치 포함', '₩55,000/인', 4.6, 'https://www.klook.com/activity/kamakura-enoshima', 'activity'),
]

const yakinikuAlts: Alternative[] = [
  alt('rest-y1-a', '야키니쿠 라이크 신주쿠', '1인 야키니쿠 전문점. 좌석 회전 빠름', '₩30,000/인', 4.3, 'https://www.google.com/maps/search/yakiniku+like+shinjuku', 'restaurant'),
  alt('rest-y1-b', '와규 이치두 닛포리점', '흑우 특선 코스. 예약 권장', '₩80,000/인', 4.8, 'https://www.tablecheck.com/shops/wagyu-ichidu', 'restaurant'),
  alt('rest-y1-c', '난바 야키니쿠 본점', '오사카 스타일 야키니쿠. 호루몬(곱창) 전문', '₩45,000/인', 4.5, 'https://www.google.com/maps/search/namba+yakiniku+tokyo', 'restaurant'),
]

const shoppingAlts: Alternative[] = [
  alt('act-shop-a', '긴자 쇼핑 (애플스토어 + 유니클로 플래그십)', '긴자 6 + GINZA SIX 백화점 코스', '무료', 4.4, 'https://www.google.com/maps/search/ginza+shopping', 'activity'),
  alt('act-shop-b', '아메요코 시장 + 우에노 공원', '전통 시장 쇼핑 + 우에노 박물관', '무료', 4.3, 'https://www.google.com/maps/search/ameyoko+market', 'activity'),
  alt('act-shop-c', '시부야 스크램블 + 도큐 플라자', '포토 스팟 + 루프탑 카페 + 쇼핑', '무료', 4.5, 'https://www.google.com/maps/search/shibuya+scramble', 'activity'),
]

const fareewllDinnerAlts: Alternative[] = [
  alt('rest-fd-a', '덴뿌라 텐이치 긴자 본점', '에도마에 텐뿌라 코스. 코스 90분', '₩70,000/인', 4.9, 'https://www.tablecheck.com/shops/tenichi-ginza', 'restaurant'),
  alt('rest-fd-b', '이자카야 와타미 신주쿠', '다양한 안주. 단체 룸 가능. 종류 200가지+', '₩35,000/인', 4.2, 'https://www.google.com/maps/search/watami+shinjuku', 'restaurant'),
  alt('rest-fd-c', '롯폰기 힐즈 루프탑 레스토랑', '야경 뷰 디너. 예약 필수 (1주 전)', '₩100,000/인', 4.7, 'https://www.tablecheck.com/shops/roppongi-rooftop', 'restaurant'),
]

// ─── 일정 데이터 ──────────────────────────────────────────────────────────────

function item(
  time: string,
  type: TripDayItem['type'],
  title: string,
  description: string,
  alternatives: Alternative[],
  bookingUrl?: string,
): TripDayItem {
  return { time, type, title, description, alternatives, bookingUrl }
}

export const MOCK_DAYS: TripDay[] = [
  {
    date: '2026-05-01',
    dayNumber: 1,
    title: '도착 & 신주쿠 탐방',
    items: [
      item('09:00', 'transport', '인천 → 나리타 (KE705)', '인천 09:00 출발 → 나리타 11:30 도착. 수하물 찾기 후 공항 익스프레스 탑승', [], 'https://www.google.com/flights?hl=ko#flt=ICN.NRT.2026-05-01'),
      item('13:00', 'accommodation', '신주쿠 그랜드 호텔 체크인', '얼리 체크인 가능 여부 사전 문의. 짐 맡기고 주변 탐색', tokyoAccommodationAlts, 'https://www.booking.com/search?ss=shinjuku+grand+hotel'),
      item('14:30', 'activity', '아키하바라 & 스카이트리 선택', '오후 자유 시간 — 아키하바라 전자상가 또는 스카이트리 전망대', akihabaraAlts),
      item('19:00', 'restaurant', '신주쿠 라멘 디너', '첫날 저녁은 부담 없는 일본 라멘으로 시작', ramenAlts),
    ],
  },
  {
    date: '2026-05-02',
    dayNumber: 2,
    title: '아사쿠사 · 하라주쿠 · 시부야',
    items: [
      item('09:00', 'activity', '아사쿠사 센소지 & 나카미세 거리', '도쿄 최고의 전통 사원. 오전 일찍 방문해 혼잡 회피. 기념품 구매', [
        alt('act-sns-a', '아사쿠사 문화 관광 센터 뷰포인트', '7층 전망대에서 센소지 전경 촬영. 무료', '무료', 4.6, 'https://www.google.com/maps/place/Asakusa+Culture+Tourist+Information+Center', 'activity'),
        alt('act-sns-b', '인력거 투어 (아사쿠사 30분)', '전통 인력거로 아사쿠사 골목 투어. 2인 탑승 가능', '₩50,000/팀', 4.5, 'https://www.klook.com/activity/asakusa-rickshaw', 'activity'),
        alt('act-sns-c', '가미나리몬 ~ 나카미세 도보 탐방', '자유 도보. 닌교야키(인형 빵) 등 길거리 음식 체험', '무료', 4.4, 'https://www.google.com/maps/search/nakamise+asakusa', 'activity'),
      ]),
      item('12:30', 'restaurant', '우에노 스시 런치', '이동 중 우에노 역 주변 스시 런치', sushiAlts),
      item('14:30', 'activity', '하라주쿠 메이지신궁 & 다케시타 거리', '신궁 산책 후 다케시타 거리 팝업 쇼핑', harajukuAlts),
      item('17:30', 'activity', '시부야 스크램블 교차로 & 저녁', '도쿄의 아이콘. 피크타임 인파 체험 후 시부야 주변 디너', shopAlts()),
      item('20:00', 'accommodation', '숙소 복귀 또는 연박', '연박 또는 시부야 근처로 이동', day2AccAlts),
    ],
  },
  {
    date: '2026-05-03',
    dayNumber: 3,
    title: '닛코 당일치기 (또는 요코하마·가마쿠라)',
    items: [
      item('07:30', 'transport', '도쿄 역 출발 (닛코 방면)', '도부 닛코선 특급 스페이시아 X 탑승. 약 1시간 50분 소요', [], 'https://www.google.com/maps/dir/Tokyo+Station/Nikko,+Tochigi'),
      item('10:00', 'activity', '닛코 동조궁 & 린노지 탐방', '세계유산 도쿠가와 사당. 당일치기 3개 코스 중 선택 가능', nikkoAlts),
      item('18:00', 'transport', '도쿄로 귀환', '신주쿠 or 도쿄 역 귀환. 피크타임 혼잡 주의', []),
      item('19:30', 'restaurant', '야키니쿠 저녁', '긴 하루의 마무리는 야키니쿠로', yakinikuAlts),
    ],
  },
  {
    date: '2026-05-04',
    dayNumber: 4,
    title: '긴자 쇼핑 & 귀국',
    items: [
      item('09:00', 'accommodation', '체크아웃 & 짐 보관', '호텔 체크아웃. 짐은 프런트 맡기고 오후까지 자유 일정', []),
      item('10:00', 'activity', '마지막 쇼핑 코스', '면세품 구매 및 기념품 쇼핑', shoppingAlts),
      item('13:00', 'restaurant', '마지막 만찬 (런치)', '도쿄 마지막 식사. 특별 레스토랑 추천', fareewllDinnerAlts),
      item('15:30', 'transport', '나리타/하네다 공항 이동', '리무진 버스 또는 익스프레스 탑승. 공항 3시간 전 도착 권장', [], 'https://www.google.com/maps/dir/Shinjuku+Station/Narita+International+Airport'),
      item('19:30', 'transport', '귀국편 탑승 (KE706)', '나리타 19:30 출발 → 인천 22:00 도착', [], 'https://www.google.com/flights?hl=ko#flt=NRT.ICN.2026-05-04'),
    ],
  },
]

// 빌드 오류 방지용 헬퍼 (Day2 저녁 재활용)
function shopAlts(): Alternative[] {
  return shoppingAlts
}

export const MOCK_BOOKING_ITEMS: BookingItem[] = [
  {
    id: 'bk-flight-out',
    type: 'flight',
    name: 'KE705 인천→나리타 (2026-05-01)',
    bookingUrl: 'https://www.google.com/flights?hl=ko#flt=ICN.NRT.2026-05-01',
    guide: ['항공권 예약 후 여권 정보 입력 필수', '72시간 전 온라인 체크인 가능'],
    status: 'pending',
    isCompleted: false,
  },
  {
    id: 'bk-flight-ret',
    type: 'flight',
    name: 'KE706 나리타→인천 (2026-05-04)',
    bookingUrl: 'https://www.google.com/flights?hl=ko#flt=NRT.ICN.2026-05-04',
    guide: ['귀국편 수하물 위탁 카운터 오픈 시간 확인'],
    status: 'pending',
    isCompleted: false,
  },
  {
    id: 'bk-hotel-1',
    type: 'accommodation',
    name: '신주쿠 그랜드 호텔 3박',
    bookingUrl: 'https://www.booking.com/search?ss=shinjuku+grand+hotel',
    guide: ['무료 취소 옵션 선택 권장', '얼리 체크인 요청 이메일 발송'],
    status: 'pending',
    isCompleted: false,
  },
  {
    id: 'bk-teamlab',
    type: 'activity',
    name: 'teamLab Borderless 입장권',
    bookingUrl: 'https://www.klook.com/activity/teamlab-borderless',
    guide: ['온라인 사전 예약 필수 (현장 구매 불가)', '방문 1시간 전 QR코드 확인'],
    status: 'pending',
    isCompleted: false,
  },
  {
    id: 'bk-nikko',
    type: 'activity',
    name: '닛코 동조궁 당일치기 투어',
    bookingUrl: 'https://www.klook.com/activity/nikko-day-trip',
    guide: ['버스 투어는 48시간 전 취소 가능', '편한 신발 착용 권장 (계단 많음)'],
    status: 'pending',
    isCompleted: false,
  },
]

export const MOCK_PLAN: TripPlan = {
  id: 'mock-tokyo-3n4d',
  params: MOCK_PARAMS,
  days: MOCK_DAYS,
  bookingItems: MOCK_BOOKING_ITEMS,
  status: 'draft',
  createdAt: '2026-05-01T00:00:00.000Z',
}
