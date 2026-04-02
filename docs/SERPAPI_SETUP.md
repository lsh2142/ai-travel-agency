# SerpAPI Google Flights 설정 가이드

## 1. API 키 발급

1. [serpapi.com](https://serpapi.com) 가입
2. 대시보드 → **[Manage API Key](https://serpapi.com/manage-api-key)** 메뉴
3. API 키 복사

> **무료 플랜:** 월 100건 / 유료 플랜: $50~/월 (5,000건)

---

## 2. 프로젝트에 키 추가

`.env.local.example`을 복사해 `.env.local`을 만들고 키를 입력합니다:

```bash
cp .env.local.example .env.local
```

`.env.local`:
```
SERPAPI_API_KEY=실제_키_값
```

> `.env.local`은 `.gitignore`에 포함되어 있어 원격 저장소에 올라가지 않습니다.

---

## 3. 동작 확인

개발 서버 재시작 후 아래로 테스트합니다:

```bash
curl "http://localhost:3000/api/flights?from=ICN&to=NRT&date=2026-05-01"
```

응답의 `"source"` 필드가 `"serpapi"`이면 실제 데이터, `"mock"`이면 fallback 상태입니다.

---

## 4. Fallback 동작

`SERPAPI_API_KEY`가 없거나 API 오류 발생 시 자동으로 mock 데이터를 반환합니다.
개발 환경에서 키 없이도 앱이 정상 동작합니다.

---

## 5. 지원 파라미터

| 파라미터 | 설명 | 예시 |
|---------|------|------|
| `from` | 출발 공항 IATA | `ICN` |
| `to` | 도착 공항 IATA 또는 도시명 | `NRT`, `도쿄` |
| `date` | 출발일 (YYYY-MM-DD) | `2026-05-01` |
| `returnDate` | 귀국일 (왕복 시) | `2026-05-07` |
| `class` | 좌석 등급 | `economy` / `business` |
