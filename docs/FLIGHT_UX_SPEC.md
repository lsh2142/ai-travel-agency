# ✈️ FLIGHT_UX_SPEC — 여행일정 → 예약 전환 시 항공권 정보 통합 UX

> 작성일: 2026-04-01
> 작성자: CEO 에이전트 (기획 회의 취합)
> 참여: 디자이너(local_62640cda) · 개발 에이전트 · 여행일정 에이전트
> 상태: ✅ 명세 확정 → 🔧 MVP 개발 착수 대기

---

## 1. 기능 개요

사용자가 여행일정을 확인하다가 예약 단계로 이동할 때, 해당 일정의 출발/도착/날짜를 자동으로 읽어 항공권 옵션을 인-앱에서 바로 비교하고 외부 예약 링크로 연결하는 UX.

### 핵심 가치 제안
- 일정 이탈 없이 항공권 확인 → 컨텍스트 유지
- 필터 없이 기본 추천 3개 이상 즉시 제공
- 가격 비교 후 Google Flights / 항공사 직항으로 1클릭 이동

---

## 2. UX 플로우

```
[여행일정 페이지]
    ↓ "✈️ 항공권 검색" 버튼 클릭
[트리거 조건 체크]
    ├─ dates.start 있음 + destination 있음
    │       ↓
    │  [Bottom Sheet 슬라이드업]
    │   항공권 카드 3개+ 표시 (로딩 중 skeleton)
    │   필터: 시간대 / 좌석등급 / 정렬
    │       ↓ 카드 클릭
    │   [Google Flights / 항공사 외부 링크 →]
    │
    ├─ dates 없음
    │       ↓
    │   "출발 날짜를 먼저 설정해주세요" 인라인 안내
    │
    └─ destination 미매핑
            ↓
        "직접 검색하기" → Google Flights 검색 URL
```

---

## 3. 디자인 명세

### 3-1. 항공권 카드 컴포넌트

```
┌─────────────────────────────────────────┐
│ 🛫 대한항공  KE-703          직항 ●     │
│ 09:00 ICN ──────────── 11:20 NRT        │
│            2시간 20분                    │
│ 이코노미                  ₩ 287,000~    │
│         [Google Flights에서 예약 ↗]     │
└─────────────────────────────────────────┘
```

| 영역 | 내용 |
|------|------|
| 상단 좌 | 항공사명 + 편명 |
| 상단 우 | 직항/경유 뱃지 (`직항 ●` 초록 / `1회 경유` 노랑) |
| 중앙 | 출발시각 — 도착시각 타임라인 바, 비행시간 |
| 하단 좌 | 좌석 등급 |
| 하단 우 | 최저 가격 (₩, `~` 접미사) |
| CTA | `bg-blue-600 text-white rounded-xl` "Google Flights에서 예약 ↗" |
| 보조 CTA | `border border-zinc-300` "항공사 직접 예약" (항공사 URL 있을 때만) |

**가격 표기 원칙**: 항상 `₩ 287,000~` 형태 ("이 가격부터"). 정확한 가격은 예약 사이트에서 확인.

### 3-2. Bottom Sheet 패널

- **트리거**: "✈️ 항공권 검색" 버튼 클릭
- **모바일**: 화면 50~75% 점유, 드래그 핸들 + X 버튼
- **PC (`lg:` breakpoint)**: 우측 사이드 패널 320px 고정
- **닫기**: 위→아래 스와이프 / X 버튼 / 배경 터치

### 3-3. 필터 UI

```
[왕복 ●] [편도]
시간대: [전체 ✓] [오전 6-12] [오후 12-18] [저녁 18-24]
등급:   [이코노미 ✓] [비즈니스]
정렬:   최저가 ↑ ▾  (드롭다운)
```

- **수평 스크롤 칩** 방식 (Tailwind: `flex gap-2 overflow-x-auto`)
- 선택: `bg-blue-600 text-white`, 미선택: `border border-zinc-300 bg-white`
- 정렬 옵션: 최저가 / 출발시간 / 비행시간

### 3-4. 로딩 상태

API 응답 대기 중 skeleton 카드 2개 표시:
```tsx
<div className="animate-pulse bg-zinc-100 rounded-xl h-24 w-full" />
```

---

## 4. API 명세

### 4-1. 엔드포인트

```
GET /api/flights

Query Parameters:
  from        string   IATA 출발 코드 (기본: ICN)
  to          string   IATA 도착 코드 또는 도시명
  date        string   YYYY-MM-DD (출발일)
  returnDate  string   YYYY-MM-DD (귀국일, 없으면 편도)
  class       string   "economy" | "business" (기본: economy)

Response 200:
{
  "outbound": FlightOption[],
  "return": FlightOption[],   // returnDate 있을 때만
  "currency": "KRW",
  "source": "mock" | "serpapi"
}
```

### 4-2. FlightOption 타입

```typescript
interface FlightOption {
  id: string                    // 편명 고유 ID
  airline: string               // 항공사명 (한국어)
  flightNumber: string          // "KE-703"
  departure: {
    airport: string             // IATA 코드
    time: string                // "HH:MM"
    date: string                // "YYYY-MM-DD"
  }
  arrival: {
    airport: string
    time: string
    date: string
  }
  duration: number              // 비행시간 (분)
  stops: number                 // 0 = 직항
  price: number                 // 최저가 (KRW 정수)
  class: 'economy' | 'business'
  bookingUrl: string            // Google Flights 또는 항공사 URL
  airlineUrl?: string           // 항공사 직항 URL (옵션)
}
```

### 4-3. 에러 응답

```
400: { "error": "missing_params", "message": "from, to, date 필수" }
404: { "error": "no_flights", "message": "해당 구간 항공편 없음" }
500: { "error": "api_error", "message": "검색 실패, 잠시 후 재시도" }
```

---

## 5. 데이터 파싱 로직

### 5-1. TripPlan → 항공권 파라미터 변환

```typescript
// lib/flights/parse-trip-params.ts

export function parseTripToFlightParams(trip: TripPlan) {
  const rawDestination = trip.params.destination ?? ''
  // "도쿄 3박4일" → "도쿄", "오사카와 교토" → "오사카"
  const cityName = rawDestination.split(/[\s,와과]+/)[0].trim()
  const toIATA = CITY_TO_IATA_MAP[cityName] ?? cityName

  return {
    from: 'ICN',
    to: toIATA,
    date: trip.params.dates?.start ?? null,
    returnDate: trip.params.dates?.end ?? null,
  }
}
```

### 5-2. IATA 매핑 테이블 (50개 주요 도시)

```typescript
export const CITY_TO_IATA_MAP: Record<string, string> = {
  // 일본
  '도쿄': 'TYO', '나리타': 'NRT', '하네다': 'HND',
  '오사카': 'OSA', '간사이': 'KIX', '교토': 'KIX',
  '삿포로': 'CTS', '후쿠오카': 'FUK', '나고야': 'NGO',
  // 동남아
  '방콕': 'BKK', '푸켓': 'HKT', '치앙마이': 'CNX',
  '싱가포르': 'SIN', '쿠알라룸푸르': 'KUL',
  '발리': 'DPS', '자카르타': 'CGK',
  '호치민': 'SGN', '하노이': 'HAN', '다낭': 'DAD',
  '마닐라': 'MNL', '세부': 'CEB',
  // 중국/홍콩/대만
  '베이징': 'PEK', '상하이': 'SHA', '광저우': 'CAN',
  '홍콩': 'HKG', '타이베이': 'TPE', '마카오': 'MFM',
  // 유럽
  '파리': 'CDG', '런던': 'LHR', '로마': 'FCO',
  '바르셀로나': 'BCN', '암스테르담': 'AMS', '프랑크푸르트': 'FRA',
  // 미주
  '뉴욕': 'JFK', '로스앤젤레스': 'LAX', '샌프란시스코': 'SFO',
  '시카고': 'ORD', '라스베이거스': 'LAS', '하와이': 'HNL',
  // 기타
  '두바이': 'DXB', '이스탄불': 'IST', '시드니': 'SYD',
}
```

### 5-3. 항공권 검색 트리거 조건

| 조건 | 동작 |
|------|------|
| `dates.start` + `destination` 모두 있음 | 정상 API 호출 → 카드 표시 |
| `dates` null | "출발 날짜를 먼저 설정해주세요" 인라인 안내 |
| `destination` 미매핑 IATA | "직접 검색하기" → Google Flights 검색 URL |
| API 에러 | 에러 메시지 + "직접 검색" 폴백 버튼 |

---

## 6. 항공권 추천 정렬 기준

기본 정렬: **직항 우선 → 오전 출발 우선 → 최저가 순**

```typescript
function sortFlights(flights: FlightOption[]): FlightOption[] {
  return [...flights].sort((a, b) => {
    // 1순위: 직항(stops: 0) 우선
    if (a.stops !== b.stops) return a.stops - b.stops
    // 2순위: 출발 시간 오전 우선 (06:00 ~ 12:00)
    const aHour = parseInt(a.departure.time.split(':')[0])
    const bHour = parseInt(b.departure.time.split(':')[0])
    if (aHour !== bHour) return aHour - bHour
    // 3순위: 가격 낮은 순
    return a.price - b.price
  })
}
```

**대안 3개 이상 필수 기준**:
- 시간대별 최소 1개 (오전/오후/저녁)
- 가격 범위 다양성 (최저가/중간/프리미엄)
- 항공사 중복 지양 (같은 항공사 최대 2개)

---

## 7. Mock 데이터 명세

`lib/mock/flights.ts` — ICN→NRT 기준 샘플 (5개):

| 편명 | 항공사 | 출발 | 도착 | 직항 | 가격 | 등급 |
|------|--------|------|------|------|------|------|
| KE-703 | 대한항공 | 09:00 | 11:20 | 직항 | ₩287,000 | 이코노미 |
| OZ-101 | 아시아나 | 07:30 | 09:55 | 직항 | ₩312,000 | 이코노미 |
| 7C-1101 | 제주항공 | 14:00 | 16:15 | 직항 | ₩198,000 | 이코노미 |
| NH-867 | ANA | 18:50 | 21:10 | 직항 | ₩345,000 | 이코노미 |
| KE-901 | 대한항공 | 10:00 | 12:20 | 직항 | ₩680,000 | 비즈니스 |

---

## 8. 예약 링크 생성

### Google Flights 검색 URL (MVP 채택)
```typescript
function buildGoogleFlightsUrl(from: string, to: string, date: string, returnDate?: string): string {
  const base = 'https://www.google.com/flights'
  if (returnDate) {
    return `${base}#flt=${from}.${to}.${date}*${to}.${from}.${returnDate};c:KRW`
  }
  return `${base}#flt=${from}.${to}.${date};c:KRW`
}
```

### 항공사 직항 URL (보조)
- 대한항공: `https://www.koreanair.com/booking/flight-booking`
- 아시아나: `https://flyasiana.com/`
- 제주항공: `https://www.jejuair.net/`

---

## 9. 신규 파일 구조

```
lib/
  flights/
    parse-trip-params.ts    # TripPlan → FlightParams 변환
    sort-flights.ts         # 정렬 로직
    booking-url.ts          # 예약 링크 생성
    iata-map.ts             # 도시명 → IATA 매핑 테이블
  mock/
    flights.ts              # Mock 항공편 데이터 (ICN→NRT, ICN→OSA, ICN→TYO)

app/
  api/
    flights/
      route.ts              # GET /api/flights 엔드포인트

components/
  flights/
    FlightBottomSheet.tsx   # Bottom Sheet 컨테이너
    FlightCard.tsx          # 개별 항공편 카드
    FlightFilter.tsx        # 시간대/등급/정렬 필터
    FlightSkeleton.tsx      # 로딩 skeleton
```

---

## 10. 개발 순서 (로드맵)

### Phase 1 — MVP (Mock 기반, 이번 스프린트)

| 순서 | 작업 | 담당 | 예상 소요 |
|------|------|------|----------|
| 1 | `lib/flights/iata-map.ts` 작성 (50개 도시) | 개발 | 1h |
| 2 | `lib/mock/flights.ts` mock 데이터 작성 (3개 구간 × 5편) | 개발 | 1h |
| 3 | `GET /api/flights` 라우트 핸들러 | 개발 | 2h |
| 4 | `FlightCard.tsx` 컴포넌트 | 디자이너 | 2h |
| 5 | `FlightFilter.tsx` 칩 필터 UI | 디자이너 | 1h |
| 6 | `FlightBottomSheet.tsx` (슬라이드업 애니메이션) | 디자이너 | 2h |
| 7 | 여행일정 페이지에 "✈️ 항공권 검색" 버튼 연결 | 개발 | 1h |
| 8 | tsc 검증 + 기능 테스트 | QA 에이전트 | 1h |

### Phase 2 — SerpAPI 연동 (다음 스프린트, SERPAPI_KEY 입력 후)

- `app/api/flights/route.ts`에서 `source: 'serpapi'` 분기 추가
- SerpAPI 응답 → `FlightOption[]` 변환 어댑터
- Redis TTL 캐싱 (Phase 3 Redis Cloud 설정 후)

### Phase 3 — 고도화 (백로그)

- 사용자 출발지 설정 (ICN 고정 해제)
- 가격 알림 기능
- 항공권 선택 → 예약 상태 저장 (Supabase)

---

## 11. 의존성 및 블로커

| 항목 | 상태 | 비고 |
|------|------|------|
| SerpAPI Key | ⏳ 미입력 | Phase 1 mock으로 우회 가능 |
| Redis Cloud | ⏳ 미설정 | Phase 1 in-memory 캐시로 우회 |
| Supabase `003_dashboard.sql` | ⏳ 미적용 | 항공권 저장 기능에는 미영향 |

---

*이 문서는 기획 회의(2026-04-01) CEO 에이전트 취합 결과입니다.*
*변경 시 CEO 에이전트 검토 후 업데이트.*
