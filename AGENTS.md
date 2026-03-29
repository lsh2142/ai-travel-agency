<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AI Travel Agent — 에이전트 레지스트리

> 마지막 업데이트: 2026-03-29 (2차 갱신)
> 관리: PM 에이전트
> 프로젝트 경로: /Users/claw/ai-travel-agent

---

## 🏗️ 프로젝트 개요

**스택**: Next.js 16 · React 19 · Supabase · BullMQ/Redis · Anthropic SDK · Telegram Bot
**배포**: Vercel (대기 중)
**브랜치 전략**: `main` ← `claude/*` (형상관리 에이전트가 머지 관리)

---

## 🤖 영구 에이전트 레지스트리

### 1. CEO 에이전트
| 항목 | 내용 |
|------|------|
| **세션 ID** | `local_4ceb4a29` |
| **역할** | 프로젝트 전략 수립, 최종 의사결정, 우선순위 조정 |
| **담당 분야** | 제품 방향성, 로드맵 관리, 에이전트 간 분쟁 조정 |
| **현재 상태** | 🟡 확인 필요 (ping 응답 없음 — 별도 세션에서 직접 확인 요망) |
| **마지막 확인** | 2026-03-29 |

### 2. 디자이너 에이전트
| 항목 | 내용 |
|------|------|
| **세션 ID** | `local_62640cda` |
| **역할** | UI/UX 설계, 컴포넌트 디자인, 사용자 경험 최적화 |
| **담당 분야** | React 컴포넌트, Tailwind CSS, shadcn/ui, 반응형 디자인 |
| **현재 상태** | 🟡 확인 필요 (ping 응답 없음 — 별도 세션에서 직접 확인 요망) |
| **마지막 확인** | 2026-03-29 |
| **최근 작업** | FlightCard UX 개선, /itinerary 대시보드, 3탭 내비게이션 |

### 3. 검증 에이전트
| 항목 | 내용 |
|------|------|
| **세션 ID** | `local_abf1d986` |
| **역할** | 코드 품질 검증, 테스트 실행, 버그 탐지, PR 리뷰 |
| **담당 분야** | Vitest 단위 테스트, E2E 검증 (Playwright), API 응답 검증 |
| **현재 상태** | 🟡 확인 필요 (ping 응답 없음 — 별도 세션에서 직접 확인 요망) |
| **마지막 확인** | 2026-03-29 |
| **중요 규칙** | 모든 머지 전 필수 통과 |

### 4. 형상관리 에이전트
| 항목 | 내용 |
|------|------|
| **세션 ID** | `local_32e8d9bb` |
| **역할** | Git 브랜치 관리, PR 생성/머지, 충돌 해소, 버전 관리 |
| **담당 분야** | `main` ← `claude/*` 머지, 브랜치 정리, 릴리즈 태깅 |
| **현재 상태** | 🟡 확인 필요 (ping 응답 없음 — 별도 세션에서 직접 확인 요망) |
| **마지막 확인** | 2026-03-29 |
| **최근 머지** | `interesting-yalow` — 마크다운 GFM 렌더링 + 탭 전환 상태 보존 |
| **대기 브랜치** | 총 41개 브랜치 존재, main은 clean 상태 |
| **중요 규칙** | 모든 브랜치 머지는 반드시 이 에이전트를 통해 진행 |

### 5. 개발서버 에이전트
| 항목 | 내용 |
|------|------|
| **세션 ID** | `local_92fbc668` |
| **역할** | 개발 서버 실행/모니터링, 핫리로드 관리, 로그 수집 |
| **담당 분야** | `next dev` 프로세스 관리, 포트 3000, 환경변수 관리 |
| **현재 상태** | 🔴 비활성 (목록에서 미확인) |
| **마지막 확인** | 2026-03-29 |
| **액션 필요** | 세션 재시작 또는 새 개발서버 에이전트 생성 검토 필요 |

---

## 🗑️ 일회성 에이전트 정리 목록

아래 에이전트들은 완료된 작업에 배정되었으며 **정리 대상**입니다.

| 세션 ID | 작업명 | 상태 | 정리 여부 |
|---------|--------|------|-----------|
| `local_5a54d641` | 마크다운 렌더링 + 탭 채팅 리셋 수정 | ✅ 완료 | 🗑️ 정리 대상 |
| `local_461c74d9` | MVP-1/2 딥링크 엔진 + 일정 관리 구현 | ✅ 완료 | 🗑️ 정리 대상 |
| `local_03f5337e` | 코딩 에이전트 — 예약 연결 기술 설계 | ✅ 완료 | 🗑️ 정리 대상 |
| `local_b76feade` | 항공권 파일 main 직접 구현 | ✅ 완료 | 🗑️ 정리 대상 |
| `local_99fd9655` | 항공권 Provider 패턴 — SerpAPI 기반 | ✅ 완료 | 🗑️ 정리 대상 |
| `local_f3119d56` | 항공권 검색 Provider 패턴 구현 | ✅ 완료 | 🗑️ 정리 대상 |
| `local_02192b91` | Phase3 — Supabase Auth 인증 구현 | ✅ 완료 | 🗑️ 정리 대상 |
| `local_61c45b8b` | Phase3 — Vercel 배포 설정 | ✅ 완료 | 🗑️ 정리 대상 |
| `local_861c161e` | Supabase 테이블 연결 최종 검증 | ✅ 완료 | 🗑️ 정리 대상 |
| `local_a7a32ac8` | env.local Supabase 키 설정 | ✅ 완료 | 🗑️ 정리 대상 |
| `local_d751d3a5` | env + migration 최종 마무리 | ✅ 완료 | 🗑️ 정리 대상 |
| `local_1495bfd6` | Supabase 실제 연동 | ✅ 완료 | 🗑️ 정리 대상 |
| `local_749bf70c` | GET /api/chat 히스토리 핸들러 추가 | ✅ 완료 | 🗑️ 정리 대상 |
| `local_1aa5844c` | Phase2 — Supabase 연동 + 히스토리 저장 | ✅ 완료 | 🗑️ 정리 대상 |
| `local_332ed130` | 텔레그램 Chat ID 조회 | ✅ 완료 | 🗑️ 정리 대상 |
| `local_f5e10307` | 텔레그램 Chat ID 확인 | ✅ 완료 | 🗑️ 정리 대상 |

---

## 📋 현재 진행 중인 작업

| 우선순위 | 작업 | 담당 에이전트 | 상태 | 블로커 |
|---------|------|--------------|------|--------|
| P1 | Streamlit 실시간 개발 전광판 | 개발 에이전트 | ✅ 완료 | — (feature/dashboard-streamlit 머지됨) |
| P1 | SerpAPI Key fallback 처리 | 개발 에이전트 | ✅ 완료 | — (SERP_API_KEY 폴백 추가됨) |
| P1 | 미인증 사용자 /auth 리다이렉트 | 개발 에이전트 | ✅ 완료 | — (wizardly-mendel 머지됨) |
| P1 | SerpAPI 실제 키 환경변수 주입 | — | ⏳ 대기 | 실제 SerpAPI Key 미제공 |
| P2 | Vercel 배포 | 형상관리 에이전트 | ⏳ 대기 | 환경변수 설정 필요 |

---

## 📐 작업 배분 원칙

```
신규 작업 → PM 에이전트 수신
    ├── 코딩/구현 → 코딩 에이전트 (일회성 생성)
    ├── 브랜치 머지 → 형상관리 에이전트 (local_32e8d9bb) [필수]
    ├── 검증/테스트 → 검증 에이전트 (local_abf1d986) [필수]
    ├── UI/UX → 디자이너 에이전트 (local_62640cda)
    └── 전략/우선순위 → CEO 에이전트 (local_4ceb4a29)
```

### 규칙
- **모든 코딩 작업**은 반드시 코딩 에이전트에게 위임 (PM이 직접 코딩 금지)
- **모든 브랜치 머지**는 반드시 형상관리 에이전트를 통해 진행
- **모든 검증**은 반드시 검증 에이전트를 통해 진행
- 일회성 에이전트는 작업 완료 후 즉시 이 문서에 정리 대상으로 등록

---

## 🗺️ 완료된 주요 마일스톤

| 날짜 | 마일스톤 | 브랜치 |
|------|---------|--------|
| 2026-03-29 | 미인증 사용자 /auth 리다이렉트 보호 | `wizardly-mendel` |
| 2026-03-29 | Streamlit 실시간 개발 전광판 (dashboard/) | `feature/dashboard-streamlit` |
| 2026-03-29 | 마크다운 GFM 렌더링 + 탭 전환 상태 보존 | `interesting-yalow` |
| 이전 | shadcn/ui + FlightCard UX + /itinerary 대시보드 | `feat/itinerary-ui` |
| 이전 | MVP-1/2 딥링크 엔진 & 여행 일정 상태 관리 | `peaceful-blackwell` |
| 이전 | Supabase Auth 인증 (Phase 3) | `clever-ellis` |
| 이전 | Redis BullMQ 모니터링 스케줄러 | `tender-blackburn` |
| 이전 | GET /api/chat 히스토리 API | `priceless-chatelet` |
| 이전 | Supabase/메모리 persistence 어댑터 패턴 | `quizzical-cray` |
| 이전 | 항공권 검색 Provider 패턴 (SerpAPI/Amadeus) | `determined-dubinsky` |
| 이전 | Vercel 배포 설정 | `priceless-hellman` |
