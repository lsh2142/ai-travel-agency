export interface FlightSearchParams {
  origin: string;        // IATA 코드 (예: "ICN") 또는 도시명
  destination: string;   // IATA 코드 (예: "NRT") 또는 도시명
  departureDate: string; // YYYY-MM-DD
  returnDate?: string;   // YYYY-MM-DD (왕복)
  passengers?: number;   // 기본 1
  cabin?: 'economy' | 'business' | 'first'; // 기본 economy
}

export interface FlightResult {
  airline: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  currency: string;
  stops: number;
  bookingUrl?: string;
}

export interface FlightProvider {
  name: string;
  search(params: FlightSearchParams): Promise<FlightResult[]>;
}
