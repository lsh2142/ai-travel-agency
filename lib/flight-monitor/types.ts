export const FLIGHT_MONITOR_JOBS_KEY = 'flight_monitor_jobs'

export interface FlightPriceAlert {
  id: string
  route: string          // e.g. "ICN-NRT"
  from: string           // IATA
  to: string             // IATA
  departureDate: string  // YYYY-MM-DD
  returnDate?: string    // YYYY-MM-DD (optional)
  targetPrice: number    // 이 가격 이하이면 알림 (KRW)
  currentPrice?: number  // 마지막 확인 가격
  telegramChatId: string
  status: 'active' | 'triggered' | 'expired'
  registeredAt: string
  lastCheckedAt?: string
  triggeredAt?: string
  bookingUrl: string
}
