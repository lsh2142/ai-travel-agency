# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
pnpm dev          # Start dev server (Next.js 16, localhost:3000)
pnpm build        # Production build
pnpm lint         # ESLint (flat config, next core-web-vitals + typescript)
pnpm test         # Run all tests (vitest)
pnpm test:watch   # Watch mode
npx vitest run __tests__/planner.test.ts  # Run single test file
npx tsc --noEmit  # Type-check without emitting
```

## Architecture Overview

**Stack:** Next.js 16.2 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Supabase (auth + DB) · Claude API (Anthropic SDK) · BullMQ + IORedis (job queues)

**Path alias:** `@/*` maps to project root (e.g., `@/lib/flights`, `@/components/ui`)

### App Router Structure (`app/`)

| Route | Purpose |
|-------|---------|
| `/` (`page.tsx`) | Landing / chat interface for travel planning |
| `/plan` | AI-generated travel plan view |
| `/booking` | Booking page (flights, accommodations, activities, rental cars) |
| `/trips` | User's saved trips |
| `/monitors` | Flight price monitoring dashboard |
| `/auth` | Authentication (Supabase-based, unauthenticated users redirect here) |

### API Routes (`app/api/`)

| Endpoint | Purpose |
|----------|---------|
| `/api/chat` | Streaming chat with Claude AI for travel planning |
| `/api/itinerary` | CRUD for travel itineraries; `/api/itinerary/save` for persistence |
| `/api/flights` | Flight search (mock data) |
| `/api/flight-monitor` | Price monitoring triggers |
| `/api/accommodations` | Accommodation search |
| `/api/activities` | Activity search |
| `/api/rental-cars` | Rental car search |
| `/api/auth/session` | Auth session management |
| `/api/parse-travel-input` | NLP parsing of free-form travel queries |
| `/api/plan` | Plan generation |
| `/api/trips` | Trip CRUD |
| `/api/monitor` | Monitoring status |

### Core Libraries (`lib/`)

- **`lib/ai/`** — Claude AI integration: `planner.ts` (travel plan generation), `travel-itinerary-agent.ts` (itinerary agent), `prompts.ts` (system prompts)
- **`lib/auth/`** — Supabase auth helpers
- **`lib/db/`** — Database client and queries
- **`lib/flights/`** — Flight search logic
- **`lib/flight-monitor/`** — Background price monitoring with BullMQ
- **`lib/itinerary/`** — Itinerary data layer
- **`lib/booking/`** — Booking logic
- **`lib/accommodations/`, `lib/activities/`, `lib/rental-cars/`** — Domain modules for each booking type
- **`lib/mock/`** — Mock data for development
- **`lib/notify/`** — Notification system (Telegram bot via `node-telegram-bot-api`)
- **`lib/monitor/`** — Monitoring utilities

### Components (`components/`)

- **`components/ui/`** — shadcn/ui primitives (Button, Card, Dialog, etc.)
- **`components/flights/`** — FlightCard, FlightBottomSheet
- Domain-specific: `AccommodationSection`, `ActivitySection`, `RentalCarSection`, `ItineraryTab`, `MonitoringTab`

### Database (`supabase/`)

- `supabase/migrations/` — SQL migration files for Supabase

### Tests

- **Unit tests:** `__tests__/` directory, run with vitest
- **E2E tests:** `tests/` directory with Playwright (`playwright.config.ts`)
- Test config: `vitest.config.ts` (node environment, `@/` alias)

## Key Technical Notes

- **Next.js 16 breaking changes**: APIs and conventions differ from training data. Read `node_modules/next/dist/docs/` before writing unfamiliar Next.js code.
- **Worktree compatibility**: `next.config.ts` dynamically finds `node_modules` root to support git worktrees.
- **Homebrew PATH**: `next.config.ts` injects `/opt/homebrew/bin` into PATH for Turbopack PostCSS worker on macOS.
- **UI style**: Dark theme with zinc color palette + blue accent. shadcn/ui components with `class-variance-authority` + `tailwind-merge` + `clsx`.
- **Fonts**: Geist (sans) + Inter, loaded via `next/font/google`.

## Environment Variables

Required in `.env.local`:
- `ANTHROPIC_API_KEY` — Claude API
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase
- `SERPAPI_KEY` — Search API (not SERP_API_KEY)
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` — Telegram notifications
- `REDIS_URL` — Redis for BullMQ (optional, for flight monitoring)

---

@AGENTS.md

---

## 📚 개인 지식 위키 참조

작업 시작 전 `/Users/claw/Documents/llmwiki/llmwiki/wiki/index.md` 를 읽어 사용자의 전체 컨텍스트를 파악하라.
특히 이 프로젝트와 관련된 페이지:
- `wiki/ai-travel-agent.md` — 이 프로젝트의 위키 페이지 (비전, 현재 상태, 블로커)
- `wiki/AI-아키텍처-트렌드-2026.md` — Agent Swarm, MoE, 추론 최적화 등 이 프로젝트에 적용할 기술 트렌드
- `wiki/liquid-ai.md` — 사용자의 다른 AI 프로젝트 (에이전트 파이프라인 패턴 공유)

위키에서 얻은 인사이트로 이 프로젝트의 설계 결정을 보강할 수 있다면 적극 활용하라.
