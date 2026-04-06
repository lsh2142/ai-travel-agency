# AI Travel Agent — 서비스 개선 로드맵

> 작성일: 2026-04-06 | 검증 에이전트(local_abf1d986) + 디자이너 에이전트(local_62640cda) 협업
> 기준 버전: main 브랜치 (커밋 aa6b335~)

---

## Phase 1 — 전체 기능 동작 현황

### 검증 방법
코드 정적 분석(전체 소스 리뷰) 기준. `tsc --noEmit` 통과 확인 완료.

### 기능별 현황표

| # | 기능 | 상태 | 비고 |
|---|------|------|------|
| 1 | 홈 → 여행 입력 (폼 + 채팅) | ✅ 정상 | `parse-travel-input` API 연동 |
| 2 | 일정 생성 (스트리밍 + 점진적 렌더링) | ✅ 정상 | SSE, `max_tokens: 16000` |
| 3 | 항공권 검색 (FlightBottomSheet) | ✅ 정상 | ICN-OKA 추가, 404 상태 구분 |
| 4 | 항공권 필터 (시간대/클래스/정렬) | ⚠️ 개선 필요 | economy 기본값 — 비즈니스만 있는 노선 시 결과 0 |
| 5 | 일정 → 확인 → 예약 페이지 진입 | ✅ 정상 | sessionStorage 체인 |
| 6 | 숙박 탭 (호텔/Airbnb) | ✅ 정상 | 도시별 mock 데이터, 실제 예약 링크 |
| 7 | 액티비티 리스트 + 링크 | ✅ 정상 | 카테고리 필터 구현 |
| 8 | Google 로그인 (OAuth PKCE) | ✅ 정상 | callback-client 분리로 수정 완료 |
| 9 | 이메일/비밀번호 로그인 | ✅ 정상 | Supabase Auth 연동 |
| 10 | 로그인 후 프로필 버튼 표시 | ✅ 정상 | `onAuthStateChange` 실시간 반영 |
| 11 | 로그아웃 | ✅ 정상 | 쿠키 삭제 + `/auth` 리다이렉트 |
| 12 | 헤더 레이아웃 (HomeButton 우측 정렬) | ✅ 정상 | `flex-1` 래퍼로 고정 |
| 13 | 미인증 사용자 접근 제어 | ❌ 버그 | proxy.ts가 `/` 포함 전체 차단 → 서비스 미체험 불가 |
| 14 | 이중 헤더 | ❌ 버그 | page.tsx(홈), plan/page.tsx 각자 자체 헤더 보유 → layout.tsx 헤더와 중복 |
| 15 | mock 항공편 bookingUrl | ⚠️ 개선 필요 | 38개 항공편에 `''` 빈 URL → Google Flights 딥링크로 교체 필요 |
| 16 | 세션 새로고침 후 데이터 유지 | ⚠️ 개선 필요 | sessionStorage 기반 — 새로고침 시 `/plan` 빈 화면 |
| 17 | 액티비티 thumbnailUrl | ⚠️ 개선 필요 | 타입에 추가됐으나 ActivitySection UI에서 미사용 |
| 18 | 토큰 만료 자동 갱신 | ⚠️ 개선 필요 | proxy.ts가 만료 토큰 감지 시 refresh 없이 /auth 리다이렉트 |
| 19 | 내 여행(trips) 저장 | ⚠️ 개선 필요 | localStorage 기반, Supabase 동기화 미완성 |
| 20 | 렌터카 기능 | ❌ 미구현 | 사용자 요청 신규 기능 |

---

## Phase 2 — 우선순위별 개선 작업

### P0 — 즉시 수정 (서비스 운영 블로커)

#### P0-1. 미인증 사용자 홈 접근 허용
**문제**: `proxy.ts`가 `/` 포함 모든 경로를 인증 없이 차단. 신규 사용자가 서비스 자체를 체험 불가.

**수정 방향**:
```typescript
// proxy.ts — 보호 경로를 명시적 화이트리스트로 변경
const PROTECTED_PATHS = ['/trips', '/booking', '/monitors']
const AUTH_PATHS = ['/auth']

// 미인증: PROTECTED_PATHS 진입 시만 /auth 리다이렉트
// 홈(/), /plan, /plan/confirm은 비로그인도 접근 허용 (일정 생성은 로그인 불필요)
```

**담당**: 코딩 에이전트
**예상 공수**: 1h

---

#### P0-2. 이중 헤더 제거
**문제**: `layout.tsx`에 전역 헤더가 있는데, `page.tsx`(홈), `plan/page.tsx`, `plan/confirm/page.tsx`에도 각자 자체 헤더 존재 → 모든 해당 페이지에서 헤더 2개 렌더링.

**수정 방향**:
- 각 페이지의 자체 `<header>` 제거 또는 `layout.tsx`에서 조건부로 전역 헤더 제거
- 또는 `layout.tsx` 헤더를 제거하고 각 페이지 헤더를 표준화 (sticky 헤더 유지 필요)
- 권장: 각 페이지의 자체 헤더를 유지하되, `layout.tsx`에서 헤더를 제거하고 `HomeButton`/`UserMenu`를 각 페이지 헤더 내부에 포함시키는 구조로 전환

**담당**: 디자이너 에이전트 + 코딩 에이전트
**예상 공수**: 2h

---

### P1 — 이번 스프린트 (UX 핵심)

#### P1-1. 항공권 우선 UX 개편 (사용자 제안 1)

**현재 문제**: 일정 먼저 생성 → 나중에 항공권 검색 → 생성된 일정 날짜와 실제 항공편이 맞지 않음.

**Option A — 항공권 선택 후 일정 생성** (권장)
```
홈 입력 → [항공권 검색 Step] → 항공편 선택/확정 → 날짜 자동 반영 → 일정 생성
```
- 장점: 실제 예약 가능한 날짜 기준으로 일정 생성 → 날짜 불일치 원천 차단
- 단점: 초기 진입 마찰 증가 (바로 일정부터 보고 싶은 사용자)
- 구현: 홈에 "항공권 먼저 보기" CTA 추가, 선택 시 FlightBottomSheet 오픈 → 항공편 선택 → 날짜 자동 세팅 → 일정 생성

**Option B — 일정 생성 후 항공편 날짜 조정 UI**
```
일정 생성 → [항공권 검색] → 다른 날짜 항공편 선택 시 "일정 날짜 조정" CTA 노출
```
- 장점: 현재 플로우 유지, 마찰 최소
- 단점: 이미 생성된 일정을 다시 생성해야 하는 낭비
- 구현: FlightBottomSheet에서 날짜 선택 시 일정 params 업데이트 + 재생성 확인 모달

**UX 판단**: **Option A 권장** — 항공권이 여행 계획의 실질적 제약 조건이므로, 출발/귀국 날짜를 먼저 확정하는 것이 자연스러운 사용자 멘탈 모델에 부합.

**구현 단계**:
1. `app/page.tsx`에 "항공권 먼저 보기" 선택지 추가 (선택, 건너뛰기 가능)
2. `FlightBottomSheet`를 홈 단계에서도 사용 가능하도록 dates 없이 검색 허용
3. 항공편 선택 시 출발/귀국 날짜를 TravelParams에 주입

**담당**: 디자이너 에이전트 + 코딩 에이전트
**예상 공수**: 1일

---

#### P1-2. mock 항공편 bookingUrl 채우기
**문제**: `lib/mock/flights.ts`에 `bookingUrl: ''` 항목 38개. 클릭해도 이동 불가.

**수정 방향**: `buildGoogleFlightsUrl()` 헬퍼로 ICN→목적지 딥링크 자동 생성 (이미 `/api/flights` 라우트에서 이 헬퍼를 사용하고 있음).
Mock 데이터 생성 시점에 적용하거나, `getMockFlights()` 반환 시 자동 주입.

**담당**: 코딩 에이전트
**예상 공수**: 30m

---

#### P1-3. 토큰 만료 자동 갱신
**문제**: `proxy.ts`가 `sb-access-token` 쿠키 유무만 확인. JWT 만료 시 refresh 없이 `/auth`로 튕김.

**수정 방향**:
```typescript
// getServerSession()에서 만료 감지 → refresh_token으로 새 토큰 발급 → 쿠키 갱신
const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value
if (refreshToken) {
  const { data } = await authClient.auth.refreshSession({ refresh_token: refreshToken })
  // 새 토큰을 응답 헤더에 Set-Cookie
}
```

**담당**: CTO 에이전트
**예상 공수**: 2h

---

#### P1-4. 일정 Supabase 저장 연동
**문제**: 현재 일정이 `sessionStorage`와 `localStorage`에만 저장. 로그인 사용자의 일정이 기기 간 동기화 안 됨, 새로고침 시 plan 페이지 빈 화면 가능.

**수정 방향**:
- 로그인 사용자: 일정 확정 시 `/api/itinerary` POST로 Supabase `travel_plans` 저장
- `/trips` 페이지: Supabase에서 로드 (이미 API 라우트 존재, localStorage 폴백 현재 사용 중)
- `/plan/page.tsx`: 생성 완료 후 자동 저장 트리거

**담당**: 코딩 에이전트
**예상 공수**: 3h

---

### P2 — 다음 스프린트 (신규 기능)

#### P2-1. 렌터카 추천 기능 (사용자 제안 2)

**기능 범위**:
- 목적지별 렌터카 업체 리스트 (업체명, 차종, 가격, 예약 링크)
- 데이터 소스: SerpAPI Google Car Rentals 또는 mock 데이터
- UI: `/booking` 페이지 내 "렌터카" 탭 추가 (숙박/액티비티 탭 옆)

**API 설계**:
```
GET /api/rentals?destination=OKA&pickupDate=2026-05-01&returnDate=2026-05-05&passengers=2
→ { results: RentalResult[], provider: 'serpapi' | 'mock' }
```

**Mock 데이터 구조**:
```typescript
interface RentalResult {
  id: string
  company: string       // "Times Car", "Toyota Rent a Car"
  carType: string       // "경차", "SUV", "미니밴"
  pricePerDay: number
  currency: string
  totalPrice: number
  passengers: number
  bookingUrl: string    // 예약 링크 필수
  features: string[]   // ["네비", "ETC", "유아시트"]
  dataSource: 'serpapi' | 'mock'
}
```

**SerpAPI 연동**: `engine: 'google_travel_hotels'` 또는 RapidAPI Skyscanner Cars
**MCP 조사 필요**: RapidAPI, Kayak, Rentalcars.com 공개 API 여부 확인

**담당**: 렌터카 에이전트 (신규 생성)
**예상 공수**: 1.5일

---

#### P2-2. 항공권 전담 에이전트 분리 (사용자 제안 3)

**현황**: SerpAPI 연동은 완료됐으나 별도 에이전트 없이 `lib/flights/` 모듈로만 관리.

**신규 에이전트 역할**:
- SerpAPI 항공권 검색 고도화 (환승, 좌석 클래스별 비교)
- 최저가 추적: 동일 노선 가격 모니터링 (기존 `/api/monitor` 패턴 응용)
- 최저가 알림: Telegram Bot 연동 (이미 `TELEGRAM_BOT_TOKEN` 환경변수 존재)
- 멀티 출발지 비교: GMP(김포) vs ICN(인천) 비교

**에이전트 스펙**:
```
항공권 에이전트
- 세션 ID: TBD (신규 생성)
- 담당: /lib/flights/, /app/api/flights/, FlightBottomSheet 컴포넌트
- 모니터링 주기: 1회/6시간
- 알림 채널: Telegram + 인앱 알림
```

**구현 단계**:
1. `FlightMonitor` 모델 Supabase 테이블 설계
2. `/api/flight-monitor` POST/GET/DELETE 엔드포인트
3. BullMQ 기반 주기적 가격 체크 worker
4. Telegram 알림 연동

**담당**: 항공권 에이전트 (신규) + CTO 에이전트
**예상 공수**: 2일

---

#### P2-3. UX 품질 개선 모음

| 항목 | 설명 | 공수 |
|------|------|------|
| 액티비티 썸네일 이미지 | `thumbnailUrl` 타입 추가됐으나 `ActivitySection` UI 미반영 | 1h |
| 항공권 필터 기본값 개선 | economy 기본값 → "전체" 기본 또는 사용 가능 클래스 자동 선택 | 1h |
| 일정 생성 재시도 UX | 에러 시 "다시 시도" 버튼 + 부분 완성 일정 표시 | 2h |
| 모바일 최적화 | `/plan` 페이지 스크롤 중 Bottom CTA 가림 현상 개선 | 1h |
| 빈 bookingUrl 처리 | `bookingUrl === '#'` 또는 `''` 시 버튼 비활성화 + 검색 유도 | 1h |

---

## Phase 3 — 신규 에이전트 구성안

### 항공권 에이전트 (신규)

```yaml
이름: 항공권 에이전트
세션 ID: TBD (신규 생성 필요)
역할: 항공권 검색·모니터링·알림 전담

담당 범위:
  - lib/flights/ 전체
  - app/api/flights/
  - app/api/flight-monitor/ (신규)
  - components/flights/ 전체

핵심 기능:
  1. SerpAPI Google Flights 고도화 (환승·직항 분리, 좌석 클래스 필터)
  2. 최저가 모니터링 (BullMQ worker, 6시간 주기)
  3. 가격 알림 (Telegram Bot + 인앱 badge)
  4. 멀티 출발지 비교 (ICN vs GMP)
  5. 날짜 유연성 검색 (±3일 최저가 캘린더)

제약:
  - TypeScript 타입 오류 0
  - 검증 에이전트 통과 필수
  - 실제 SERP_API_KEY 없을 시 mock 데이터로 graceful fallback

보고 대상: CTO 에이전트 → 검증 에이전트 → 형상관리 에이전트
```

---

### 렌터카 에이전트 (신규)

```yaml
이름: 렌터카 에이전트
세션 ID: TBD (신규 생성 필요)
역할: 렌터카 검색·예약 링크 제공 전담

담당 범위:
  - lib/rentals/ (신규)
  - app/api/rentals/ (신규)
  - components/RentalSection.tsx (신규)

핵심 기능:
  1. 도시별 렌터카 mock 데이터 (일본/오키나와/제주/해외 주요 도시)
  2. SerpAPI Google Car Rentals 연동 (SERP_API_KEY 있을 시)
  3. 예약 링크 (Times Car, Toyota Rent, NIPPON Rent-a-Car 딥링크)
  4. /booking 페이지 "렌터카" 탭으로 통합

데이터 우선순위:
  - SerpAPI → mock (기존 accommodations/activities 패턴 동일 적용)

제약:
  - 예약 링크 없는 데이터는 노출하지 않음
  - 가격이 불확실한 항목은 "가격 문의" 표시

보고 대상: CTO 에이전트 → 검증 에이전트 → 형상관리 에이전트
```

---

## 환경변수 설정 가이드 (배포 전 필수)

Vercel 대시보드 → Settings → Environment Variables:

| 변수명 | 필수 | 설명 |
|--------|------|------|
| `NEXT_PUBLIC_SITE_URL` | ✅ 필수 | `https://your-domain.com` (OAuth redirectTo, 이메일 인증 링크) |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ 필수 | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ 필수 | Supabase anon key |
| `ANTHROPIC_API_KEY` | ✅ 필수 | Claude API 키 |
| `SERP_API_KEY` | 선택 | SerpAPI 키 (없으면 mock 데이터 사용) |
| `TELEGRAM_BOT_TOKEN` | 선택 | 알림 봇 토큰 |
| `TELEGRAM_CHAT_ID` | 선택 | 알림 수신 채팅 ID |
| `REDIS_URL` | 선택 | BullMQ 큐 (모니터링 기능 사용 시 필수) |

> **Supabase Dashboard 설정도 필수**:
> - Authentication → URL Configuration → Site URL: `https://your-domain.com`
> - Authentication → URL Configuration → Redirect URLs: `https://your-domain.com/auth/callback`
> - Authentication → Providers → Google: Client ID / Secret 입력

---

## 작업 우선순위 요약

```
P0 (즉시)
  ├── P0-1. proxy.ts 미인증 차단 범위 수정 (홈/plan 공개)
  └── P0-2. 이중 헤더 제거

P1 (이번 스프린트)
  ├── P1-1. 항공권 우선 UX 개편 (Option A)
  ├── P1-2. mock 항공편 bookingUrl 딥링크 채우기
  ├── P1-3. 토큰 만료 자동 갱신
  └── P1-4. 일정 Supabase 저장 연동

P2 (다음 스프린트)
  ├── P2-1. 렌터카 추천 기능
  ├── P2-2. 항공권 전담 에이전트
  └── P2-3. UX 품질 개선 모음 (썸네일, 필터, 모바일)
```

---

*최종 업데이트: 2026-04-06 | 관리: PM 에이전트*
