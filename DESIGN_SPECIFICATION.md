# AI Travel Agent — Design Specification

> 버전: 1.1
> 작성일: 2026-03-30 (v1.0) / 2026-03-30 (v1.1)
> 작성: Designer Agent
> 상태: 초안 — A안 반영 완료, 개발자 구현 검토 대기
>
> **v1.1 변경 요약:** `/` 화면 폼+채팅 병행 구조 채택, AutoBookingPanel 제거(v2 이전), Auth 전략 명시, 에이전트 트리거 조건 완화, 핵심 타입 정의 섹션 추가

---

## 1. 서비스 개요

### 목적
사용자가 여행 계획 수립부터 예약까지 AI 에이전트와 자연스럽게 대화하며 완료할 수 있는 통합 여행 플래닝 서비스.

### 타겟 사용자
- 일본 여행을 계획하는 20~40대 한국인
- 여행 계획에 시간을 많이 쓰기 싫지만 퀄리티는 포기하기 싫은 사용자
- 숙소 빈방 알림 등 세심한 예약 관리가 필요한 사용자

### 핵심 가치
| 가치 | 설명 |
|---|---|
| **시간 절약** | AI가 조건에 맞는 최적 일정을 즉시 생성 |
| **선택권 보장** | 각 카테고리 최소 3개 대안 제시, 사용자가 최종 결정 |
| **예약 연속성** | 일정 승인 후 딥링크 + 가이드로 예약 흐름 완주 지원 |
| **투명성** | 예약 상태·비용·대기 항목을 한눈에 파악 |

---

## 2. 전체 UX 플로우

```
┌─────────────────────────────────────────────────────────────────┐
│                        사용자 진입                               │
│              / (홈 · 여행 정보 입력)                             │
└──────────────────────────┬──────────────────────────────────────┘
                           │ 필수 정보 입력 완료 (지역 + 날짜)
                           │ 미입력 항목 → 에이전트가 추천값 제안
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     /plan (일정 기획)                            │
│  여행일정 에이전트 → Day-by-Day 플랜 스트리밍 생성               │
│  각 숙소·액티비티 → 최소 3개 대안 카드 표시                       │
│  사용자: 대안 선택 / 항목 편집 / 순서 조정                        │
└──────────────────────────┬──────────────────────────────────────┘
                           │ "이 일정으로 진행하기" 클릭
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                  /plan/confirm (최종 승인)                       │
│  전체 일정 요약 · 총 예상 비용 · 예약 필요 항목 목록             │
│  사용자: 최종 확인 후 "예약 시작" 승인                           │
└──────────────────────────┬──────────────────────────────────────┘
                           │ 승인
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   /booking (예약 진행)                           │
│                                                                 │
│  모든 항목 = ManualBookingCard 형태로 통일                       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  예약처 이름 + 딥링크 URL                                  │  │
│  │  에이전트 생성 단계별 예약 가이드 (텍스트)                  │  │
│  │  ☐ 완료 체크박스                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ※ 자동 예약 에이전트 처리는 v2 로드맵으로 이전                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │ 모든 항목 처리 완료 (또는 건너뜀)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                  /trips/[id] (여행 상세)                         │
│  예약 완료 항목 + 전체 일정이 한 곳에 정리                        │
│  빈방 모니터링 대기 항목 표시                                     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   /trips (내 여행 목록)                          │
│  과거 + 예정 여행 카드 목록                                       │
└─────────────────────────────────────────────────────────────────┘
```

### 화면 전환 요약

```
/ ──(입력완료)──▶ /plan ──(승인)──▶ /plan/confirm ──(예약시작)──▶ /booking
                                                                      │
/trips ◀──────────────────────────────────────────────────(완료)──────┘
  │
  └──(카드클릭)──▶ /trips/[id]
```

---

## 3. 인증(Auth) 전략

> 기존 구현: `/auth` 페이지 (Supabase Auth) 존재

### 화면별 인증 요구사항

| 화면 | 인증 | 비고 |
|---|---|---|
| `/` | 게스트 허용 | 로그인 시 최근 여행 이력 표시 |
| `/plan` | 게스트 허용 | 로그인 없이 플랜 생성 가능 |
| `/plan/confirm` | 게스트 허용 | 승인까지 로그인 불필요 |
| `/booking` | **인증 필수** | 미로그인 시 `/auth?redirect=/booking` |
| `/trips` | **인증 필수** | 미로그인 시 `/auth?redirect=/trips` |
| `/trips/[id]` | **인증 필수** | 미로그인 시 `/auth?redirect=/trips/[id]` |

### 리다이렉트 흐름

```
미로그인 사용자 → /booking 접근
  → /auth?redirect=/booking
  → 로그인 완료
  → /booking 자동 복귀 (redirect 파라미터 사용)
```

### 구현 원칙
- 인증 필수 화면: 서버사이드에서 `getServerSession()` 확인 후 미인증 시 리다이렉트
- 게스트 허용 화면: 클라이언트에서 세션 확인, 없어도 렌더링 계속
- `/plan/confirm` → `/booking` 전환 시점에 로그인 유도 모달 표시 (강제 아님)

---

## 4. 화면 목록 (Screen Inventory)

### 4-1. `/` — 여행 정보 입력 (홈/온보딩) [A안: 폼+채팅 병행]

**역할:** 서비스 첫 진입점. 구조화 폼과 자유 채팅을 모두 허용해 진입 장벽을 낮춘다.

**레이아웃 구조**
```
┌────────────────────────────────────────┐
│  상단: 구조화 입력 폼 (선택 입력)        │
│  ┌──────────┐ ┌──────────┐ ┌────────┐  │
│  │  지역    │ │  날짜    │ │ 인원   │  │
│  └──────────┘ └──────────┘ └────────┘  │
│  [테마 멀티셀렉트]  [예산 (선택)]        │
│                                        │
│  ── 또는 자유롭게 말씀해 주세요 ──      │
│                                        │
│  하단: 채팅 입력창                      │
│  ┌──────────────────────────────────┐  │
│  │ "도쿄로 3박4일 혼자 가고 싶어요" │  │
│  └──────────────────────────────────┘  │
│                                        │
│  [일정 만들기 →]  ← 필수 필드 충족 시 활성 │
└────────────────────────────────────────┘
```

**동작 방식**
- 폼 직접 입력 OR 채팅 자유형 입력 중 하나만으로도 진행 가능
- 채팅 입력 시 에이전트가 텍스트를 파싱해 폼 항목을 자동으로 채움
  - 예: "도쿄로 3박4일 혼자" → `destination: 도쿄`, `dates: +3박`, `guests: 1` 자동 반영
- 채팅과 폼의 내용이 모두 `TravelParams`로 병합되어 "일정 만들기" 전달
- 빈 항목은 에이전트가 추천값으로 채움 (폼에 chip으로 표시)

**주요 컴포넌트**
- `TravelInputForm` — 지역·날짜·인원·테마·예산 입력 (선택 항목)
- `ConceptSelector` — 여행 테마 멀티셀렉트 (최대 3개)
- `AgentSuggestionChip` — 미입력 항목에 대한 AI 추천값 pill
- `ChatInputBar` — 자유형 텍스트 입력창 ("또는 자유롭게 말씀해 주세요")
- `FormFillIndicator` — 채팅 파싱 결과를 폼에 시각적으로 반영하는 애니메이션
- `RecentTripCard` — 최근 여행 이력 (로그인 사용자)

**상태 변수**
```ts
destination: string
dates: { depart: string; return: string } | null
guests: number
concepts: string[]
budget: string | null
freeText: string               // 채팅 입력값
agentSuggestions: Partial<TravelParams>  // AI 추천 기본값
isParsingChat: boolean         // 채팅 파싱 중 로딩 상태
```

**다음 화면 이동 조건**
- `destination` 또는 `freeText` 중 하나 이상 입력 → "일정 만들기" 버튼 활성화
- 버튼 클릭 시 빈 항목은 에이전트 추천으로 자동 보완 후 `/plan` 진입

---

### 4-2. `/plan` — 일정 기획 결과

**역할:** AI 에이전트가 생성한 Day-by-Day 플랜을 표시하고, 사용자가 대안을 선택·편집한다.

**주요 컴포넌트**
- `PlanProgressBar` — 에이전트 생성 진행 상태 표시
- `DaySection` — 날짜별 일정 섹션 (접힘/펼침)
- `ItineraryCard` — 개별 항목 카드 (항공·숙소·액티비티)
- `AlternativeSelector` — 3개 대안 횡스크롤 카드
- `PlanSummaryBar` — 하단 고정 바 (총 비용·선택 현황·CTA)

**상태 변수**
```ts
plan: TripPlan                        // 에이전트 생성 결과
selectedAlternatives: Record<string, string>  // itemId → 선택된 대안 id
isGenerating: boolean
editingItemId: string | null
```

**다음 화면 이동 조건**
- 모든 날짜의 필수 항목(숙소)에 대안 선택 완료 → `/plan/confirm` 버튼 활성화

---

### 4-3. `/plan/confirm` — 최종 일정 승인

**역할:** 선택된 일정 전체 요약과 예약 필요 항목 목록을 보여주고, 사용자가 최종 승인한다.

**주요 컴포넌트**
- `TripOverviewHeader` — 여행 제목·날짜·인원·총 비용
- `ItineraryTimeline` — 날짜별 타임라인 (읽기 전용)
- `BookingRequiredList` — 예약 필요 항목 체크리스트
- `CostBreakdown` — 항목별 비용 테이블
- `ConfirmCTA` — "예약 시작" 버튼

**상태 변수**
```ts
confirmedPlan: TripPlan
totalEstimatedCost: number
bookingItems: BookingItem[]     // 자동/수동 예약 분류됨
```

**다음 화면 이동 조건**
- "예약 시작" 클릭 → `/booking`
- "이전으로" 클릭 → `/plan`

---

### 4-4. `/booking` — 예약 진행

**역할:** 모든 예약 항목을 `ManualBookingCard`로 통일 표시. 각 항목에 딥링크와 단계별 가이드를 제공해 사용자가 직접 예약을 완료할 수 있도록 안내한다.

> ⚠️ **AutoBookingPanel (자동 예약 에이전트) 은 v2 로드맵으로 이전됨.** v1에서는 모든 예약이 ManualBookingCard 형태로 처리된다.

**주요 컴포넌트**
- `ManualBookingCard` — 예약 항목 카드 (예약처명·딥링크·에이전트 생성 단계 가이드·완료 체크박스)
- `BookingStatusBadge` — 예약 상태 배지
- `BookingProgressSummary` — 전체 진행률 표시 (N/M 완료)
- `MonitoringEnrollButton` — 빈방 대기 등록 버튼 (숙소 항목에 한해 표시)

**ManualBookingCard 세부 구조**
```
┌─────────────────────────────────────────┐
│  🏨 신주쿠 호텔A          ⏳ 예약 필요  │
│  체크인 05.01 ~ 체크아웃 05.06          │
│                                         │
│  예약 방법:                             │
│  1. 아래 링크를 탭하세요                 │
│  2. 날짜·인원 확인 후 결제 진행          │
│  3. 예약 확인 번호를 메모해두세요         │
│                                         │
│  [부킹닷컴에서 예약하기 →]              │
│  [🔔 빈방 모니터링 등록]                 │
│                                 [완료 ✓]│
└─────────────────────────────────────────┘
```

**상태 변수**
```ts
bookingItems: BookingItem[]
completedIds: Set<string>
skippedIds: Set<string>
```

**다음 화면 이동 조건**
- 모든 항목 처리(완료 또는 건너뜀) → `/trips/[newTripId]`
- 인증 필요: 미로그인 시 `/auth?redirect=/booking` 으로 리다이렉트

---

### 4-5. `/trips` — 내 여행 목록

**역할:** 사용자의 모든 여행(예정·진행 중·완료)을 카드 목록으로 보여준다.

**주요 컴포넌트**
- `TripFilterTabs` — 전체 / 예정 / 완료 필터
- `TripSummaryCard` — 여행 요약 카드 (목적지·날짜·예약현황)
- `EmptyState` — 여행 없을 때 온보딩 CTA

**상태 변수**
```ts
trips: Trip[]
activeFilter: 'all' | 'upcoming' | 'completed'
```

**다음 화면 이동 조건**
- 카드 클릭 → `/trips/[id]`

---

### 4-6. `/trips/[id]` — 특정 여행 상세

**역할:** 예약 완료 항목과 전체 일정이 한 카드에 정리된 여행 상세 화면.

**주요 컴포넌트**
- `TripHeader` — 여행 제목·날짜·D-day 뱃지
- `ItineraryTimeline` — 날짜별 전체 일정 타임라인
- `BookingStatusBadge` — 각 항목 예약 상태
- `MonitoringAlertCard` — 빈방 모니터링 대기 항목
- `TripCostSummary` — 최종 비용 요약

**상태 변수**
```ts
trip: Trip
items: ItineraryItem[]
monitoringJobs: MonitorJob[]
```

**다음 화면 이동 조건**
- "여행 수정" → `/plan?tripId=[id]`
- "공유하기" → 공유 시트

---

## 5. 핵심 컴포넌트 스펙

### `TravelInputForm`
**역할:** 구조화 폼 상단부. 채팅 파싱 결과를 실시간으로 폼에 반영하고, 미입력 항목에 AI 추천값 chip을 표시.

**Props**
```ts
interface TravelInputFormProps {
  value: Partial<TravelParams>;
  onChange: (updated: Partial<TravelParams>) => void;
  agentSuggestions?: Partial<TravelParams>;
  isLoading?: boolean;
}
```

**사용 화면:** `/`

---

### `ItineraryCard`
**역할:** 항공·숙소·액티비티 등 일정 단일 항목을 카드로 표시. 예약 상태 배지 포함.

**Props**
```ts
interface ItineraryCardProps {
  item: ItineraryItem;
  showAlternatives?: boolean;
  onSelectAlternative?: (itemId: string, altId: string) => void;
  onEdit?: (itemId: string) => void;
  variant?: 'editable' | 'readonly';  // /plan vs /trips/[id]
}
```

**사용 화면:** `/plan`, `/plan/confirm`, `/trips/[id]`

---

### `AlternativeSelector`
**역할:** 숙소·액티비티에 대한 3개 대안을 횡스크롤 카드로 표시. 선택 시 ItineraryCard에 반영.

**Props**
```ts
interface AlternativeSelectorProps {
  alternatives: Alternative[];      // 최소 3개
  selectedId: string | null;
  onSelect: (altId: string) => void;
  category: 'hotel' | 'activity' | 'restaurant';
}
```

**사용 화면:** `/plan`

---

### `BookingStatusBadge`
**역할:** 예약 상태를 색상 코드 배지로 표시.

**Props**
```ts
interface BookingStatusBadgeProps {
  status: 'booked' | 'pending' | 'monitoring' | 'manual_required' | 'skipped';
  size?: 'sm' | 'md';
}
```

**상태별 색상**
| status | 색상 | 라벨 |
|---|---|---|
| `booked` | emerald | ✅ 예약완료 |
| `pending` | amber | ⏳ 예약 필요 |
| `monitoring` | blue | 🔔 모니터링 중 |
| `manual_required` | orange | 🔗 직접 예약 |
| `skipped` | zinc | — 건너뜀 |

**사용 화면:** `/plan/confirm`, `/booking`, `/trips/[id]`

---

### `TripSummaryCard`
**역할:** `/trips` 목록에서 여행 1건을 요약 카드로 표시.

**Props**
```ts
interface TripSummaryCardProps {
  trip: {
    id: string;
    title: string;
    destination: string;
    startDate: string;
    endDate: string;
    coverImageUrl?: string;
    bookingProgress: { total: number; completed: number };
    status: 'upcoming' | 'ongoing' | 'completed';
  };
  onClick: (id: string) => void;
}
```

**사용 화면:** `/trips`

---

## 6. 컬러 팔레트 & 타이포그래피

### 컬러 팔레트

| 역할 | 이름 | Hex | Tailwind |
|---|---|---|---|
| Primary | Blue 600 | `#2563EB` | `blue-600` |
| Primary Hover | Blue 700 | `#1D4ED8` | `blue-700` |
| Secondary | Zinc 700 | `#3F3F46` | `zinc-700` |
| Accent | Amber 400 | `#FBBF24` | `amber-400` |
| Success | Emerald 500 | `#10B981` | `emerald-500` |
| Warning | Orange 400 | `#FB923C` | `orange-400` |
| Danger | Red 500 | `#EF4444` | `red-500` |
| Background | Zinc 50 | `#FAFAFA` | `zinc-50` |
| Surface | White | `#FFFFFF` | `white` |
| Surface Alt | Zinc 100 | `#F4F4F5` | `zinc-100` |
| Border | Zinc 200 | `#E4E4E7` | `zinc-200` |
| Text Primary | Zinc 900 | `#18181B` | `zinc-900` |
| Text Secondary | Zinc 500 | `#71717A` | `zinc-500` |
| Text Muted | Zinc 400 | `#A1A1AA` | `zinc-400` |

### 타이포그래피

**폰트 패밀리**
- UI 전체: `Inter` (sans-serif) — `font-sans`
- 숫자·코드: `JetBrains Mono` — `font-mono`

**사이즈 스케일**

| 역할 | 크기 | Tailwind | 용도 |
|---|---|---|---|
| Display | 30px / 700 | `text-3xl font-bold` | 페이지 타이틀 |
| Heading 1 | 24px / 600 | `text-2xl font-semibold` | 섹션 헤더 |
| Heading 2 | 18px / 600 | `text-lg font-semibold` | 카드 제목 |
| Body | 14px / 400 | `text-sm` | 본문 |
| Caption | 12px / 400 | `text-xs` | 메타정보, 라벨 |
| Label | 12px / 500 | `text-xs font-medium` | 폼 라벨, 배지 |

---

## 7. 반응형 브레이크포인트

| 구분 | 기준 | Tailwind prefix | 레이아웃 |
|---|---|---|---|
| Mobile | < 640px | (base) | 단일 컬럼, 하단 네비게이션 탭바 |
| Tablet | 640px ~ 1023px | `sm:` | 2컬럼 가능, 상단 탭 네비게이션 |
| Desktop | ≥ 1024px | `lg:` | 사이드바 + 메인 2분할, max-w-5xl 중앙 정렬 |

### 모바일 우선 고려사항
- 하단 탭바: `fixed bottom-0` + `pb-safe` (iOS 노치 대응)
- 카드 터치 타깃: 최소 44×44px
- 횡스크롤 대안 카드: `overflow-x-auto scrollbar-none`
- 날짜 입력: 네이티브 `<input type="date">` 사용 (모바일 픽커 활용)

---

## 8. 에이전트 개입 시점 명세

| 화면 | 에이전트 | 트리거 조건 | 처리 내용 |
|---|---|---|---|
| `/` | **입력 보조 에이전트** | "일정 만들기" 버튼 submit 시도 + 필수 필드 미입력 감지 | 여행 기간·인원·예산 추천값 chip 생성 |
| `/` | **채팅 파싱 에이전트** | 채팅 입력창 Enter 또는 전송 버튼 | 자유형 텍스트 파싱 → TravelParams 항목 자동 채움 |
| `/plan` | **여행일정 에이전트** | 폼 submit 후 `/plan` 진입 즉시 | Day-by-Day 플랜 스트리밍 생성, 각 항목별 3개 대안 병렬 검색 |
| `/plan` | **항공편 검색 에이전트** | 플랜 생성 완료 후 `[FLIGHTS_SEARCH:]` 트리거 감지 | 실시간 항공편 검색 결과 카드 삽입 |
| `/plan` | **숙소 검색 에이전트** | 날짜·인원 확정 시 | 각 체크인 날짜별 숙소 3개 대안 검색 |
| `/booking` | **예약 가이드 에이전트** | `/plan/confirm`에서 "예약 시작" 승인 후 | 각 항목별 단계별 예약 가이드 텍스트 생성 + 딥링크 URL 구성 |
| `/booking` | **빈방 모니터링 에이전트** | 사용자가 숙소 항목에서 "모니터링 등록" 선택 시 | BullMQ 잡 등록, 텔레그램 알림 설정 |
| `/booking` | ~~자동 예약 에이전트~~ | ~~v2 이전~~ | ~~API 연동 항목 자동 예약 처리~~ |
| `/trips/[id]` | **여행 준비 에이전트** | D-7 도달 시 (크론) | 준비물 체크리스트·현지 날씨·환율 정보 카드 자동 추가 |

### 에이전트 상태 표시 원칙
- 에이전트 처리 중: `PlanProgressBar` + 단계별 텍스트 (스트리밍)
- 에이전트 완료: 결과 카드 페이드인 애니메이션
- 에이전트 실패: 에러 카드 + 수동 처리 대안 제시 (절대 빈 화면 없음)

---

## 9. 핵심 타입 정의

> 구현 시 `lib/types/travel.ts` 에 위치 권장

```ts
interface TravelParams {
  destination: string
  people: number
  dates: { start: string; end: string } | null
  themes: string[]
  freeText: string          // 채팅 자유형 입력 원문 (파싱 전)
}

interface Alternative {
  id: string
  name: string
  description: string
  price: string
  rating?: number
  bookingUrl: string
  imageUrl?: string
}

interface BookingItem {
  id: string
  type: 'flight' | 'accommodation' | 'activity' | 'transport'
  name: string
  bookingUrl: string
  guide: string[]           // 에이전트 생성 단계별 가이드 (텍스트 배열)
  status: 'booked' | 'pending' | 'monitoring' | 'manual_required' | 'skipped'
  isCompleted: boolean
}

interface Trip {
  id: string
  title: string
  destination: string
  startDate: string
  endDate: string
  status: 'upcoming' | 'ongoing' | 'completed'
  bookingItems: BookingItem[]
  itinerary: TripItinerary  // lib/itinerary/types.ts 참조
}
```

---

## 10. v2 로드맵 (현재 스펙 범위 외)

| 기능 | 설명 |
|---|---|
| 자동 예약 에이전트 | API 연동 완료된 항목 자동 예약 처리 + 상태 폴링 |
| 실시간 가격 추적 | 항공·숙소 가격 변동 알림 |
| 여행 공유 | `/trips/[id]` 공유 링크 생성 |
| 다국어 지원 | 영어·일본어 UI |
