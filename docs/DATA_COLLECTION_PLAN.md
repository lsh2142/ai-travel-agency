# 데이터 수집 계획서

> 작성일: 2026-04-01
> 작성: 여행일정 에이전트
> 목적: AI Travel Agent 서비스의 실시간 데이터 수집 전략 수립

---

## 1. 항공권 정보 수집

### 추천 순위

| 순위 | API | 무료 티어 | 비용 | 데이터 품질 | 구현 난이도 |
|------|-----|----------|------|-----------|-----------|
| 🥇 1순위 | **SerpAPI Google Flights** | 100건/월 | $75~/월 (5,000건) | ★★★★★ | 쉬움 |
| 🥈 2순위 | **Kiwi.com Tequila API** | 무제한 (무료) | $0 (커미션 기반) | ★★★★ | 쉬움 |
| 🥉 3순위 | **Amadeus Flight Offers** | 2,000건/월 (테스트) | GDS 단가 (공개 미정) | ★★★★★ | 보통 |

#### SerpAPI Google Flights (1순위)
- **현황:** 이미 `lib/flights/serpapi-provider.ts`에 통합됨
- **무료 티어:** 100건/월 (개발·테스트 충분)
- **유료:** $75/월 → 5,000건, $150/월 → 15,000건
- **반환 데이터:** 항공사·편명·출발/도착 시간, 가격, 경유지, 탄소배출량, booking_token(Google Flights 딥링크)
- **주의:** 실제 예약 API 아님 — Google Flights로 리다이렉트

#### Kiwi.com Tequila API (2순위)
- **무료 티어:** API 자체 무료 (Kiwi.com 커미션 수익 모델)
- **강점:** Virtual interlining (코드쉐어 없는 항공사 조합) — GDS가 못 찾는 저가 루트 발굴
- **적합 대상:** 유연 날짜·배낭여행·복합 루트 검색
- **등록:** tequila.kiwi.com — 승인 수일 소요

#### Amadeus (3순위, 장기)
- **무료 티어:** 테스트 환경 2,000건/월 (캐시 데이터, 실제 요금 아님)
- **프로덕션:** 별도 승인·청구 설정 필요
- **강점:** 실제 항공사 GDS 인벤토리, 예약 API까지 지원
- **적합 시점:** 직접 예약 기능 구현 시 (v2 로드맵)

#### ❌ Skyscanner — 제외
신규 개발자 자체 신청 불가. 월 트래픽 기준 심사 (사실상 기존 사업자 전용).

---

### MVP vs 장기 방향

| 단계 | 전략 |
|------|------|
| **MVP (현재)** | SerpAPI 유지 (이미 통합) + SERPAPI_KEY 환경변수 주입으로 즉시 활성화 |
| **단기** | Kiwi Tequila API 추가 — 저가 항공 보완, SerpAPI 월 한도 초과 시 fallback |
| **장기 (v2)** | Amadeus 프로덕션 승인 → 실제 예약 플로우 구현 |

---

## 2. 여행지 데이터

### 추천 순위

| 순위 | API | 무료 티어 | 비용 | 데이터 품질 | 구현 난이도 |
|------|-----|----------|------|-----------|-----------|
| 🥇 1순위 | **Google Places API (New)** | 10,000건/월 (Essentials) | $17~32/1,000건 | ★★★★★ | 쉬움 |
| 🥈 2순위 | **TripAdvisor Content API** | 5,000건/월 | 종량제 | ★★★★ | 보통 |
| 🥉 3순위 | **OpenTripMap API** | ~1,000건/일 (무료) | $19~/월 | ★★★ | 쉬움 |

#### Google Places API — New (1순위)
- **무료 티어:** 10,000 Essentials 요청/월 (2025년 3월 이후 기준, 기존 $200 크레딧 종료)
- **유료:** Essentials $2~7/1,000건, Pro(Text Search 포함) $17~32/1,000건
- **반환 데이터:** 장소명·주소·좌표·사진·평점·영업시간·가격대·편집 요약
- **활용법:** `"things to do in 교토"` 텍스트 검색 → 여행지 목록 즉시 생성
- **주의:** Advanced 필드 요청 시 비용 급증 — FieldMask로 필드 최소화 필수

#### TripAdvisor Content API (2순위)
- **무료 티어:** 5,000건/월 — MVP 운영에 충분
- **강점:** 리뷰 데이터 품질 최상, 호텔·식당·명소 통합
- **제약:** 브랜딩 귀속(attribution) 필수, 데이터 재판매 금지
- **승인:** 임시 키 발급 후 정식 승인 과정 필요

#### OpenTripMap API (3순위 / POI 보조)
- **무료 티어:** 하루 ~1,000건 (완전 무료)
- **강점:** 바운딩 박스·반경 기반 POI 대량 수집, Wikipedia 설명 포함
- **약점:** 사진·리뷰·영업시간 없음, 아시아 커버리지 불균등
- **적합 용도:** 일정 아이템 근처 명소 보조 데이터 (비용 0원)

#### 계절별·테마별 큐레이션 전략
- **AI 생성 큐레이션:** Claude에게 여행 테마·시즌을 주고 여행지 목록 생성 → Google Places로 상세 데이터 보완
- **웹 크롤링:** Anthropic ToS 내에서 정적 페이지만 허용 (robots.txt 준수 필수). TripAdvisor·Lonely Planet 직접 크롤링은 법적 리스크 있음 → 공식 API 우선

---

### MVP vs 장기 방향

| 단계 | 전략 |
|------|------|
| **MVP** | Claude 생성 + OpenTripMap으로 POI 보완 (비용 $0) |
| **단기** | Google Places API 통합 — Text Search로 고품질 장소 데이터 |
| **장기** | TripAdvisor Content API 추가 — 리뷰·평점 신뢰도 강화 |

---

## 3. 액티비티 정보

### 추천 순위

| 순위 | API | 무료 티어 | 비용 | 데이터 품질 | 구현 난이도 |
|------|-----|----------|------|-----------|-----------|
| 🥇 1순위 | **Viator Partner API** | $0 (커미션 기반) | 예약당 8~12% 커미션 | ★★★★★ | 보통 |
| 🥈 2순위 | **Google Places (활동 검색)** | 10,000건/월 | $17~32/1,000건 | ★★★★★ | 쉬움 |
| 🥉 3순위 | **Klook Affiliate** | $0 (커미션) | 판매당 2~5% | ★★★★ | 어려움 |

#### Viator Partner API (1순위)
- **비용:** API 이용료 $0, 예약 성사 시 8~12% 커미션
- **인벤토리:** 전 세계 300,000+ 투어·액티비티·체험
- **접근 단계:**
  - Basic Affiliate: 빠른 승인, 링크 리다이렉트 방식
  - Full Affiliate: 검색·상세·가용성 API 전체
  - Full+Booking: 자체 결제 플로우 (별도 승인)
- **신청:** affiliateapi@tripadvisor.com 이메일 접수
- **우리 서비스 적합도:** 최상 — 전 세계 커버리지, 커미션 수익 모델

#### Google Places API — 활동 검색 (2순위, 즉시 가능)
- **활용법:** `tourist_attraction`, `museum`, `amusement_park` 타입 필터로 액티비티 발굴
- **한계:** 예약 기능 없음 — Viator/Klook 딥링크와 조합 필요
- **장점:** 별도 승인 없이 즉시 사용 가능, Google Places 키 하나로 여행지+액티비티 통합

#### Klook Affiliate (3순위)
- **강점:** 일본·한국·동남아·홍콩·대만 등 아시아-태평양 특화 — 우리 타겟 사용자에게 최적
- **한계:** 공개 API 없음, 파트너 계약 필요 (affiliate.klook.com 신청)
- **현실적 접근:** Travelpayouts 네트워크 통해 Klook 링크 생성 (API 데이터 없이 딥링크만 가능)

#### ❌ GetYourGuide — 제외
월 100만 방문·300건 예약 최소 기준. 신규 서비스 불가.

---

### MVP vs 장기 방향

| 단계 | 전략 |
|------|------|
| **MVP** | Claude 생성 액티비티 설명 + `lib/booking/links.ts`의 Klook·Viator 딥링크 (이미 구현됨) |
| **단기** | Google Places Text Search 통합 (`tourist_attraction` 타입) — 현지 활동 발굴 |
| **단기** | Viator Basic Affiliate 신청 → 승인 후 링크 기반 예약 연동 |
| **장기** | Viator Full API 승인 → 실시간 가용성·가격 표시 + Klook 파트너 계약 |

---

## 통합 추천 스택 (우선순위 순)

```
항공권:   SerpAPI (현재) → Kiwi Tequila (fallback) → Amadeus (v2 예약)
여행지:   Claude 생성 → OpenTripMap (무료 POI) → Google Places (고품질)
액티비티: 딥링크 현행 유지 → Google Places 발굴 → Viator Full API (장기)
리뷰:    TripAdvisor Content API (5,000건/월 무료 — 단기 추가 권장)
```

---

## 예상 비용 요약

| 운영 단계 | 월 예상 비용 | 비고 |
|---------|-----------|------|
| **MVP (현재)** | $0 | Claude 생성 + 딥링크만 사용 |
| **단기 (API 추가)** | $75~150 | SerpAPI $75 + Google Places 소량 |
| **성장 단계** | $200~500 | SerpAPI + Google Places + TripAdvisor |
| **스케일 단계** | 커미션 수익으로 상쇄 | Viator 커미션 수입이 비용 초과 예상 |

---

## 즉시 실행 가능한 액션

1. **`SERPAPI_KEY` 환경변수 주입** → 항공편 검색 즉시 활성화 (이미 코드 통합됨)
2. **Viator Affiliate 신청** → affiliateapi@tripadvisor.com (승인 1~2주)
3. **Kiwi Tequila 계정 등록** → tequila.kiwi.com (승인 수일)
4. **Google Places API 키 발급** → Google Cloud Console (즉시)
5. **TripAdvisor Content API 키 신청** → developer-tripadvisor.com (수일)
