export interface FlightOption {
  id: string
  airline: string
  flightNumber: string
  departure: {
    airport: string
    time: string
    date: string
  }
  arrival: {
    airport: string
    time: string
    date: string
  }
  duration: number        // 비행시간 (분)
  stops: number           // 0 = 직항
  price: number           // 최저가 (KRW 정수)
  class: 'economy' | 'business'
  bookingUrl: string      // Google Flights 또는 항공사 URL
  airlineUrl?: string     // 항공사 직항 URL (옵션)
}

export interface FlightApiResponse {
  outbound: FlightOption[]
  return?: FlightOption[]
  currency: 'KRW'
  source: 'mock' | 'serpapi'
}
