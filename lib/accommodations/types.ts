// 숙박 Provider 패턴 인터페이스 (추후 구현)

export interface AccommodationSearchParams {
  destination: string;   // 도시명 또는 지역
  checkIn: string;       // YYYY-MM-DD
  checkOut: string;      // YYYY-MM-DD
  guests?: number;       // 기본 2
  rooms?: number;        // 기본 1
  maxPrice?: number;     // 최대 1박 가격 (KRW)
  type?: 'hotel' | 'ryokan' | 'guesthouse' | 'any'; // 기본 any
}

export interface AccommodationResult {
  name: string;
  type: 'hotel' | 'ryokan' | 'guesthouse' | 'other';
  location: string;
  checkIn: string;
  checkOut: string;
  pricePerNight: number;
  currency: string;
  totalPrice: number;
  rating?: number;
  reviewCount?: number;
  amenities?: string[];
  bookingUrl?: string;
  thumbnailUrl?: string;
  available: boolean;
}

export interface AccommodationProvider {
  name: string;
  search(params: AccommodationSearchParams): Promise<AccommodationResult[]>;
}
