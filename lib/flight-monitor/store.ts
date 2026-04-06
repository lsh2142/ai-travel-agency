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

if (process.env.NODE_ENV !== 'production') {
  globalThis.__flightMonitorStore = flightMonitorStore
}
