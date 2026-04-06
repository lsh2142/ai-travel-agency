/**
 * Server-side in-memory flight monitor store.
 * 실제 운영에서는 Supabase 테이블로 교체 예정.
 */
import type { FlightPriceAlert } from './types'

declare global {
  // eslint-disable-next-line no-var
  var __flightMonitorStore: Map<string, FlightPriceAlert> | undefined
}

export const flightMonitorStore: Map<string, FlightPriceAlert> =
  globalThis.__flightMonitorStore ?? new Map<string, FlightPriceAlert>()

// 항상 globalThis에 저장 — 프로덕션 cold start 시에도 동일 Map 인스턴스 재사용
globalThis.__flightMonitorStore = flightMonitorStore
