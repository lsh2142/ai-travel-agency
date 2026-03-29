export interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers?: number;
  cabin?: 'economy' | 'business' | 'first';
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
