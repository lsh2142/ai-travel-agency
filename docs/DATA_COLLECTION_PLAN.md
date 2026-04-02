# 여행 데이터 수집 계획서

> 작성일: 2026-04-02 | 담당: 여행일정 에이전트
> 목적: AI Travel Agent 서비스에 필요한 외부 데이터 API 선정 및 구현 로드맵

---

## 1. 항공권 정보

### MVP 추천 (1순위): Amadeus for Developers

무료 테스트 환경에서 Flight Offers Search 2,000회/월, Flight Offers Price 3,000회/월 제공. 실제 GDS(Global Distribution System) 데이터 기반으로 데이터 신뢰도 최고 수준. Node.js SDK 공식 지원.

### 장기 추천: SerpAPI Google Flights (스케일업 시)

Google Flights 실시간 스크래핑. 구현이 가장 간단하나 비용 대비 효율은 낮음.

| 서비스 | 무료티어 | 가격 (유료) | 난이도 | 실시간 | 비고 |
|--------|---------|-------------|--------|--------|------|
| **Amadeus for Developers** | 2,000회/월 (테스트) | 초과분 사용량 기반 과금 | ⭐⭐⭐ 중간 | ✅ GDS 실시간 | 공식 Node.js SDK, 가장 신뢰도 높음 |
| **SerpAPI Google Flights** | 250 queries/월 | ~$50/월 (Hobby) 이상 | ⭐ 쉬움 | ✅ Google 실시간 | 스크래핑 기반, 간단한 구현 |
| **Skyscanner (RapidAPI)** | ~1,000회/월 | $15/월 (Basic) | ⭐⭐ 쉬움-중간 | ✅ 실시간 | 비공식 3rd-party API, 안정성 주의 |
| **Kiwi.com Tequila API** | 무료 시작 (한도 미공개) | 어필리에이트 수수료 모델 | ⭐⭐ 중간 | ✅ 실시간 | 저가항공 강점, 회원가입 필요 |

### 구현 참고

- Amadeus: `npm install amadeus` 후 `AMADEUS_CLIENT_ID`, `AMADEUS_CLIENT_SECRET` 환경변수 설정
- 테스트 환경(test.api.amadeus.com) → 프로덕션(api.amadeus.com) 전환 시 키 재발급 필요
- SerpAPI는 현재 프로젝트에 이미 키 환경변수 설정 예정 (백로그 참고)

---

## 2. 여행지 데이터

### MVP 추천 (1순위): Google Places API (New)

2025년 3월 개편 이후 Essentials SKU 10,000회/월 무료. 데이터 품질 최고. Places Search, Place Details, Photos 모두 커버.

### 장기 추천: Foursquare Places API (보완재)

Google Places가 커버 못하는 소규모 로컬 장소 보완용.

| 서비스 | 무료티어 | 데이터 품질 | 주요 제공 정보 | 비고 |
|--------|---------|------------|--------------|------|
| **Google Places API (New)** | 10,000회/월 (Essentials SKU) | ⭐⭐⭐⭐⭐ 최고 | 장소 검색, 상세정보, 사진, 리뷰, 영업시간, 평점 | 2025.3월 과금 체계 변경. $200 크레딧→SKU별 무료 한도 |
| **TripAdvisor Content API** | 5,000회/월 | ⭐⭐⭐⭐ 높음 | 호텔·레스토랑 리뷰, 사진, 평점, 위치 정보 | 신용카드 등록 필요, 일일 예산 한도 설정 방식 |
| **Foursquare Places API** | 10,000회/월 (Pro 엔드포인트) | ⭐⭐⭐ 중간 | POI 검색, 카테고리, 위치. 사진·영업시간은 유료 ($18.75/1,000) | 로컬 데이터 강점, 사진 등 Premium 엔드포인트는 무료 없음 |
| **Booking.com Affiliate API** | 무료 (파트너 승인 시) | ⭐⭐⭐⭐ 높음 | 숙박 검색, 실시간 가격, 예약 가능 여부 | **현재 신규 파트너 등록 중단** (T&C 업데이트 중) |

### 구현 참고

- Google Places: 2025년 3월 이후 `@googlemaps/google-maps-services-js` 사용 권장
- Billing 프로젝트에 API 키 활성화 필수 (무료라도 결제 수단 등록 필요)
- TripAdvisor는 `X-TripAdvisor-API-Key` 헤더 방식

---

## 3. 액티비티 / 체험

### MVP 추천 (1순위): Viator Affiliate API

즉시 Basic Access 발급 가능 (사전 승인 불필요). 190,000+ 체험 상품, 8% 커미션. TripAdvisor 계열사로 안정성 보장.

### 장기 추천: GetYourGuide + Klook 병행

GetYourGuide는 유럽·미주 강세, Klook은 아시아·한국 강세. 두 API 병행으로 커버리지 극대화.

| 서비스 | API 공개 여부 | 수수료 구조 | 한국 여행자 친화도 | 비고 |
|--------|------------|------------|-----------------|------|
| **Viator API** | ✅ Basic Access 즉시 발급 | 8% 커미션 (30일 쿠키) | ⭐⭐⭐ 중간 | Full Access는 자격 조건 충족 필요. TripAdvisor 소속 |
| **GetYourGuide** | ⚠️ 파트너 신청 후 승인 | 8~10% 커미션 | ⭐⭐ 낮음 | 유럽 강세. 아시아 콘텐츠는 Klook 대비 적음 |
| **Klook** | ⚠️ 커스텀 파트너십 계약 | 2~5% 커미션 (아시아 최대 5%) | ⭐⭐⭐⭐⭐ 매우 높음 | 한국·동아시아 콘텐츠 최강. 직접 API는 기업 계약 필요 |
| **KKday** | ✅ KKpartners 프로그램 | 5% 커미션 (30일 쿠키) | ⭐⭐⭐⭐ 높음 | 대만 기반. 한국·아시아 체험 다수. Coupon API 지원 |

### 구현 참고

- Viator: `affiliateapi@tripadvisor.com` 통해 Full Access 신청
- Klook: `klook.com/partner/` 파트너 포털에서 API 커스텀 계약 협의
- KKday: `kkpartners.kkday.com`에서 어필리에이트 가입 후 링크 API 사용

---

## 결론 및 구현 순서

### MVP (즉시 구현 가능)

| 영역 | 선택 API | 이유 |
|------|---------|------|
| 항공권 | **Amadeus for Developers** | 무료 테스트 환경, GDS 신뢰도, 공식 SDK |
| 여행지 | **Google Places API** | 10,000회/월 무료, 데이터 품질 최고 |
| 액티비티 | **Viator Affiliate API** | 즉시 Basic Access, 승인 불필요 |

**예상 월 API 비용 (MVP):** $0 (모두 무료 티어 범위 내)

### Phase 2 (트래픽 증가 시)

| 영역 | 추가할 API | 목적 |
|------|----------|------|
| 항공권 | SerpAPI Google Flights | 보완적 실시간 검색 (Amadeus 미지원 LCC 커버) |
| 여행지 | TripAdvisor Content API | 리뷰·평점 데이터 보강 |
| 액티비티 | KKday + Klook | 한국·아시아 체험 커버리지 확대 |

### Phase 3 (서비스 성숙기)

- Booking.com Affiliate API 파트너 신청 (현재 신규 등록 중단 → 재개 시 즉시 신청)
- Amadeus 프로덕션 환경 전환
- Viator Full + Booking Access 승급

---

## 환경변수 목록 (구현 준비용)

```bash
# 항공권
AMADEUS_CLIENT_ID=
AMADEUS_CLIENT_SECRET=
SERPAPI_KEY=                    # 백로그에 이미 등록됨

# 여행지
GOOGLE_PLACES_API_KEY=
TRIPADVISOR_API_KEY=

# 액티비티
VIATOR_API_KEY=
KKDAY_AFFILIATE_ID=
```

---

*참고 출처: SerpAPI, Amadeus Developers, Foursquare Docs, TripAdvisor Developer Portal, Viator Partner Resources, GetYourGuide Partner Portal, Klook Affiliate, KKpartners (조사 기준일: 2026-04-02)*
