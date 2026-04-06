# 항공권 우선 UX 개편 — 구현 계획서

> 상태: 검토 대기 (미구현)
> 작성: 2026-04-06 | 승인 후 구현 진행

---

## 1. 변경 전/후 사용자 플로우 비교

### 현재 플로우 (일정 우선)

```
[홈]
목적지 / 날짜 / 인원 / 테마 입력
        ↓
[/plan]
AI 일정 스트리밍 생성 (날짜 기반)
"✈️ 항공권 검색" 버튼 (하단 CTA)
        ↓
FlightBottomSheet 사이드 패널
항공편 확인 → 외부 링크로 이탈
        ↓
[/plan/confirm]
일정 최종 확인
        ↓
[/booking]
숙박 / 액티비티 예약
```

**문제점**
- 항공권을 보기 전에 AI 일정이 이미 날짜를 확정해버림
- 원하는 항공편이 없으면 날짜 수정 → 일정 **재생성** 필요 (Claude API 재호출)
- FlightBottomSheet가 외부 링크(Google Flights)로만 연결 → 실제 선택/확정 개념 없음

---

### 목표 플로우 (항공권 우선)

```
[홈]
목적지 / 인원 / 테마 입력
(날짜는 선택사항 — 항공권에서 결정 가능)
        ↓
  ┌─────────────────────┐
  │  항공권 검색 스텝    │  ← 신규
  │  /flight-search      │
  └─────────────────────┘
  출발일·귀국일 선택
  항공편 목록 표시
  항공편 선택 → "이 항공편으로 일정 만들기"
        ↓ (날짜 자동 확정)
[/plan]
AI 일정 스트리밍 생성
(선택한 항공편 날짜가 자동 반영)
        ↓
[/plan/confirm]
일정 확인 + 선택 항공편 요약 카드
        ↓
[/booking]
숙박 / 액티비티 예약
(항공편은 이미 선택 완료로 표시)
```

**개선 효과**
- 항공편 날짜 = 일정 날짜 → 불일치 원천 차단
- 항공편 가격이 총 예산에 즉시 반영
- 항공편 재검색 없이 일정이 확정된 날짜로 생성됨

---

### 항공권 없이 진행하는 경로 (선택적)

홈에서 날짜를 직접 입력한 경우 또는 "항공권 나중에 선택"을 누른 경우:

```
[홈] → (날짜 직접 입력) → [/plan] (기존 플로우 유지)
```

항공권 스텝은 **필수가 아닌 선택**으로 설계 — 기존 사용자 플로우를 깨지 않음.

---

## 2. 각 화면 구성

### 화면 A — 홈 (`app/page.tsx`) 변경

**추가 UI: 항공권 검색 CTA 버튼**

```
┌─────────────────────────────────────┐
│  목적지: [도쿄                    ]  │
│  인원:   [2]  테마: [미식] [액티비티]│
│  날짜: (선택) [출발] ~ [귀국]        │  ← 날짜 Optional 표시 변경
│                                      │
│  ┌──────────────────────────────┐   │
│  │  ✈️ 항공권 먼저 찾기  →      │   │  ← 신규 CTA (메인)
│  └──────────────────────────────┘   │
│                                      │
│  ─────────── 또는 ───────────        │
│                                      │
│  [날짜 직접 입력 후 일정 바로 만들기]│  ← 기존 플로우 (서브)
└─────────────────────────────────────┘
```

**변경 내용**
- 날짜 입력 필드: "필수 → 선택" (placeholder: "항공권에서 자동 설정")
- 메인 CTA: "일정 만들기" → "✈️ 항공권 먼저 찾기" (날짜 미입력 시)
- 날짜 입력 시: "일정 바로 만들기" CTA 노출 (기존 플로우)

---

### 화면 B — 항공권 검색 스텝 (`app/flight-search/page.tsx`) 신규

**전체 화면 레이아웃 (모바일 최적화)**

```
┌─────────────────────────────────────┐
│  ← 뒤로    ✈️ 항공권 선택           │  ← nav (페이지 서브 네비)
├─────────────────────────────────────┤
│  ICN → 도쿄 (TYO)                   │  ← 출발지/목적지 고정 표시
│                                      │
│  출발일  [2026-05-01 ▼]              │
│  귀국일  [2026-05-05 ▼]              │
│                                      │
│  [검색]                              │
├─────────────────────────────────────┤
│  ─── 항공편 목록 ───                 │
│                                      │
│  [FlightFilter] (시간대/클래스/정렬) │
│                                      │
│  ┌ FlightCard ──────────────────┐   │
│  │  대한항공 KE-701  직항 ✓     │   │
│  │  09:00 ICN → 11:30 NRT       │   │
│  │  2시간 30분  |  ₩ 268,000~   │   │
│  │  [ 이 항공편으로 일정 만들기 ] │   │  ← 신규 버튼
│  └──────────────────────────────┘   │
│                                      │
│  ┌ FlightCard ──────────────────┐   │
│  │  아시아나 OZ-101  직항 ✓     │   │
│  │  11:00 ICN → 13:25 NRT       │   │
│  │  2시간 25분  |  ₩ 245,000~   │   │
│  │  [ 이 항공편으로 일정 만들기 ] │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

**컴포넌트 구성**
- 날짜 선택: `<input type="date">` 2개 (출발/귀국)
- 항공편 목록: 기존 `FlightFilter` + `FlightCard` 재사용
- `FlightCard`에 "이 항공편으로 일정 만들기" 버튼 추가 (props로 분기)
- 선택 시: `sessionStorage`에 선택 항공편 저장 → `/plan`으로 이동

**선택 항공편 표시 상태**

```
┌ FlightCard (선택됨) ─────────────────┐
│  ✅ 선택된 항공편                      │  ← 선택 표시
│  대한항공 KE-701  직항  09:00→11:30  │
│  [다른 항공편 선택] [이 일정으로 계속→]│
└──────────────────────────────────────┘
```

---

### 화면 C — 일정 생성 (`app/plan/page.tsx`) 변경

**항공편 선택 정보 배너 추가 (선택된 경우)**

```
┌─────────────────────────────────────┐
│  ← 뒤로    도쿄 일정        3일      │
├─────────────────────────────────────┤
│  ┌── 선택 항공편 ─────────────────┐ │  ← 신규 배너
│  │  ✈️ KE-701  5/1 09:00 ICN→NRT │ │
│  │  귀국 KE-702  5/5 13:00 NRT→ICN│ │
│  │               [변경]            │ │
│  └────────────────────────────────┘ │
│                                      │
│  Day 1 — 5월 1일 (화)               │
│  ...                                 │
└─────────────────────────────────────┘
```

---

### 화면 D — 일정 확인 (`app/plan/confirm/page.tsx`) 변경

**예약 항목에 항공편 카드 추가**

```
┌─────────────────────────────────────┐
│  총 예산: ₩ 1,247,000               │  ← 항공편 가격 포함
│                                      │
│  ✈️ 항공편                           │
│  ┌──────────────────────────────┐   │
│  │  KE-701  5/1 09:00 ICN→NRT  │   │
│  │  ₩268,000/인  ×2인 = ₩536,000│   │
│  │  [Google Flights 예약]        │   │
│  └──────────────────────────────┘   │
│                                      │
│  🏨 숙박 (3박)                       │
│  ...                                 │
└─────────────────────────────────────┘
```

---

## 3. 데이터 흐름

### 새로운 세션스토리지 구조

```typescript
// 기존 (변경 없음)
sessionStorage.setItem('travelParams', JSON.stringify(TravelParams))

// 신규 추가
interface SelectedFlight {
  outbound: FlightOption       // 선택한 출발 항공편
  return?: FlightOption        // 선택한 귀국 항공편 (왕복 시)
  confirmedDates: {
    start: string              // outbound.departure.date
    end: string                // return.departure.date
  }
}
sessionStorage.setItem('selectedFlight', JSON.stringify(SelectedFlight))
```

### 항공편 선택 → 일정 생성 연결 로직

```
[flight-search/page.tsx]
  사용자가 항공편 선택
        ↓
  selectedFlight 세션스토리지 저장
  travelParams.dates를 항공편 날짜로 업데이트
  sessionStorage.setItem('travelParams', updatedParams)
        ↓
  router.push('/plan')

[plan/page.tsx]
  travelParams 읽기 (날짜 이미 포함)
  selectedFlight 읽기 (선택 배너 표시용)
  → 기존 generatePlan() 로직 그대로 동작
  (날짜가 항공편에서 왔는지 알 필요 없음)
```

### `buildItineraryRequest()` 변경 여부

**변경 없음.** `TravelParams.dates`가 이미 항공편 날짜로 채워져 있으므로 AI 프롬프트 생성 로직은 그대로 동작합니다.

### 총 예산 계산 (`plan/confirm/page.tsx`)

```typescript
// 항공편 가격 추가
const flightData = sessionStorage.getItem('selectedFlight')
const selectedFlight = flightData ? JSON.parse(flightData) as SelectedFlight : null

let totalBudget = 0
if (selectedFlight) {
  totalBudget += selectedFlight.outbound.price * params.people
  if (selectedFlight.return) {
    totalBudget += selectedFlight.return.price * params.people
  }
}
// + 기존 숙박/액티비티 비용 합산
```

---

## 4. 영향받는 파일 목록

### 신규 생성 (2개)

| 파일 | 설명 |
|------|------|
| `app/flight-search/page.tsx` | 항공권 검색 스텝 전체 화면 (신규 페이지) |
| `lib/types/flight-session.ts` | `SelectedFlight` 세션 타입 정의 |

### 수정 필요 (5개)

| 파일 | 변경 내용 | 난이도 |
|------|-----------|--------|
| `app/page.tsx` | 날짜 선택 Optional 처리, CTA 분기 ("항공권 먼저" vs "바로 일정") | 낮음 |
| `app/plan/page.tsx` | selectedFlight 읽기 + 선택 배너 표시 | 낮음 |
| `app/plan/confirm/page.tsx` | 항공편 카드 표시 + 총 예산에 항공편 가격 합산 | 중간 |
| `components/flights/FlightCard.tsx` | `onSelect?: (flight: FlightOption) => void` props 추가 (선택 버튼 분기) | 낮음 |
| `components/flights/FlightBottomSheet.tsx` | 선택 모드(select mode) props 추가 (기존 "검색만" 모드와 공존) | 중간 |

### 변경 불필요 (재사용)

- `lib/flights/flight-option.ts` — 타입 그대로 사용
- `lib/flights/parse-trip-params.ts` — 그대로 사용
- `lib/mock/flights.ts` — 그대로 사용
- `lib/ai/travel-itinerary-agent.ts` — 변경 없음
- `app/api/flights/route.ts` — 변경 없음

---

## 5. 구현 난이도 및 예상 작업량

### 난이도 평가: ★★★☆☆ (보통)

재활용 가능한 컴포넌트(`FlightCard`, `FlightFilter`, `FlightBottomSheet`)가 이미 완성되어 있어 UI 재구현 부담이 낮습니다. 핵심 작업은 새 페이지 라우팅과 세션스토리지 연결입니다.

### 작업 단계별 공수 추정

| 단계 | 작업 | 공수 |
|------|------|------|
| 1 | `lib/types/flight-session.ts` 타입 정의 | 30분 |
| 2 | `FlightCard`에 `onSelect` props 추가 | 30분 |
| 3 | `app/flight-search/page.tsx` 신규 페이지 구현 | 2시간 |
| 4 | `app/page.tsx` CTA 분기 처리 | 30분 |
| 5 | `app/plan/page.tsx` 선택 배너 추가 | 30분 |
| 6 | `app/plan/confirm/page.tsx` 항공편 카드 + 예산 합산 | 1시간 |
| 7 | tsc 검증 + 기존 플로우 회귀 테스트 | 30분 |
| **합계** | | **약 5.5시간** |

### 리스크 및 고려사항

**R1. 날짜 없이 항공권 검색**
- 홈에서 목적지만 입력하고 날짜 없이 `flight-search`로 이동 가능
- `flight-search` 페이지 내에서 날짜를 입력받는 구조로 처리 → 문제 없음

**R2. 항공권 미선택 상태에서 /plan 직접 진입**
- 기존 플로우(날짜 직접 입력)는 그대로 유지되므로 영향 없음
- `selectedFlight`가 없으면 배너 미표시, 기존 동작

**R3. FlightCard 선택 버튼 중복**
- 현재 FlightCard에 "Google Flights 예약" 버튼이 있음
- `onSelect` props가 있을 때만 "이 항공편으로 일정 만들기" 버튼을 추가 렌더링
- 없으면 기존 외부 링크 버튼만 표시 → 하위 호환

**R4. 왕복 항공편 처리**
- 출발편 선택 후 귀국편도 선택해야 하는 2단계 흐름
- MVP: 출발편만 선택 → 귀국일은 날짜 picker로 직접 입력 (귀국편 자동 검색)
- 향후: 귀국편도 목록에서 선택 가능한 2단계 UI

---

## 최종 의사결정 필요 항목

승인 전 아래 2가지를 확인해주세요:

1. **항공권 스텝 필수 여부**
   - 안 A (권장): 홈에서 "항공권 먼저 찾기" 버튼 클릭 시에만 진입, 날짜 직접 입력 시 기존 플로우
   - 안 B: 항공권 스텝을 항상 필수로 (날짜 직접 입력 제거)

2. **귀국편 처리 방식 (MVP 범위)**
   - 안 A (권장): 출발편만 선택, 귀국일은 날짜 picker
   - 안 B: 출발편/귀국편 모두 목록에서 선택 (공수 +2시간)

---

*검토 후 승인 시 코딩 에이전트 투입 예정*
