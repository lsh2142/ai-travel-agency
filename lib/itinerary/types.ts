export type BookingStatus = 'planned' | 'booked' | 'confirmed';
export type ItemType = 'flight' | 'accommodation' | 'car_rental' | 'activity';

export interface ItineraryItem {
  id: string;
  type: ItemType;
  date: string; // YYYY-MM-DD
  title: string;
  description?: string;
  bookingStatus: BookingStatus;
  bookingUrl?: string;
  bookingReference?: string;
  price?: number;
  currency?: string;
  flightData?: import('@/lib/flights/types').FlightResult;
}

export interface TripItinerary {
  id: string;
  title: string; // e.g. "서울→도쿄 5박6일"
  startDate: string;
  endDate: string;
  items: ItineraryItem[];
  createdAt: string;
  updatedAt: string;
}
