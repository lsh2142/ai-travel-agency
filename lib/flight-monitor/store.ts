/**
 * Flight monitor store — Supabase `flight_price_alerts` 테이블 영속화.
 * Supabase 미설정 시 in-memory fallback으로 동작.
 *
 * Migration (supabase/migrations/004_flight_price_alerts.sql):
 *   CREATE TABLE flight_price_alerts (
 *     id TEXT PRIMARY KEY,
 *     route TEXT NOT NULL,
 *     origin TEXT NOT NULL,
 *     destination TEXT NOT NULL,
 *     departure_date TEXT NOT NULL,
 *     return_date TEXT,
 *     target_price INTEGER NOT NULL,
 *     current_price INTEGER,
 *     telegram_chat_id TEXT NOT NULL,
 *     status TEXT NOT NULL DEFAULT 'active',
 *     registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 *     last_checked_at TIMESTAMPTZ,
 *     triggered_at TIMESTAMPTZ,
 *     booking_url TEXT NOT NULL
 *   );
 */
import { createClient } from '@supabase/supabase-js'
import type { FlightPriceAlert } from './types'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
const TABLE = 'flight_price_alerts'

// ── In-memory fallback (Supabase 미설정 시) ─────────────────────────────────
declare global {
  // eslint-disable-next-line no-var
  var __flightMonitorFallback: Map<string, FlightPriceAlert> | undefined
}
const fallbackStore: Map<string, FlightPriceAlert> =
  globalThis.__flightMonitorFallback ?? new Map<string, FlightPriceAlert>()
globalThis.__flightMonitorFallback = fallbackStore

function getDb() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } })
}

// ── DB row ↔ FlightPriceAlert 변환 ──────────────────────────────────────────
type AlertRow = {
  id: string
  route: string
  origin: string
  destination: string
  departure_date: string
  return_date: string | null
  target_price: number
  current_price: number | null
  telegram_chat_id: string
  status: string
  registered_at: string
  last_checked_at: string | null
  triggered_at: string | null
  booking_url: string
}

function rowToAlert(row: AlertRow): FlightPriceAlert {
  return {
    id: row.id,
    route: row.route,
    from: row.origin,
    to: row.destination,
    departureDate: row.departure_date,
    returnDate: row.return_date ?? undefined,
    targetPrice: row.target_price,
    currentPrice: row.current_price ?? undefined,
    telegramChatId: row.telegram_chat_id,
    status: row.status as FlightPriceAlert['status'],
    registeredAt: row.registered_at,
    lastCheckedAt: row.last_checked_at ?? undefined,
    triggeredAt: row.triggered_at ?? undefined,
    bookingUrl: row.booking_url,
  }
}

function alertToRow(alert: FlightPriceAlert): Omit<AlertRow, 'registered_at'> & { registered_at: string } {
  return {
    id: alert.id,
    route: alert.route,
    origin: alert.from,
    destination: alert.to,
    departure_date: alert.departureDate,
    return_date: alert.returnDate ?? null,
    target_price: alert.targetPrice,
    current_price: alert.currentPrice ?? null,
    telegram_chat_id: alert.telegramChatId,
    status: alert.status,
    registered_at: alert.registeredAt,
    last_checked_at: alert.lastCheckedAt ?? null,
    triggered_at: alert.triggeredAt ?? null,
    booking_url: alert.bookingUrl,
  }
}

// ── CRUD 함수 ────────────────────────────────────────────────────────────────

export async function getAlerts(alertId?: string): Promise<FlightPriceAlert[]> {
  const db = getDb()
  if (!db) {
    const all = Array.from(fallbackStore.values())
      .sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime())
    return alertId ? all.filter((a) => a.id === alertId) : all
  }

  let query = db.from(TABLE).select('*').order('registered_at', { ascending: false })
  if (alertId) query = query.eq('id', alertId)

  const { data, error } = await query
  if (error) {
    console.error('[flight-monitor/store] getAlerts error:', error.message)
    return []
  }
  return (data as AlertRow[]).map(rowToAlert)
}

export async function saveAlert(alert: FlightPriceAlert): Promise<void> {
  const db = getDb()
  if (!db) {
    fallbackStore.set(alert.id, alert)
    return
  }

  const { error } = await db.from(TABLE).upsert(alertToRow(alert))
  if (error) {
    console.error('[flight-monitor/store] saveAlert error:', error.message)
    fallbackStore.set(alert.id, alert) // Supabase 실패 시 fallback
  }
}

export async function updateAlert(id: string, patch: Partial<FlightPriceAlert>): Promise<void> {
  const db = getDb()
  if (!db) {
    const existing = fallbackStore.get(id)
    if (existing) fallbackStore.set(id, { ...existing, ...patch })
    return
  }

  const row: Partial<AlertRow> = {}
  if (patch.currentPrice !== undefined) row.current_price = patch.currentPrice
  if (patch.lastCheckedAt !== undefined) row.last_checked_at = patch.lastCheckedAt
  if (patch.status !== undefined) row.status = patch.status
  if (patch.triggeredAt !== undefined) row.triggered_at = patch.triggeredAt

  const { error } = await db.from(TABLE).update(row).eq('id', id)
  if (error) {
    console.error('[flight-monitor/store] updateAlert error:', error.message)
  }
}

export async function deleteAlert(id: string): Promise<boolean> {
  const db = getDb()
  if (!db) {
    return fallbackStore.delete(id)
  }

  const { error } = await db.from(TABLE).delete().eq('id', id)
  if (error) {
    console.error('[flight-monitor/store] deleteAlert error:', error.message)
    return false
  }
  return true
}
