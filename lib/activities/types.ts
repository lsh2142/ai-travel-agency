export interface ActivitySearchParams {
  destination: string;
  date?: string;
  guests?: number;
  category?: 'tour' | 'experience' | 'food' | 'outdoor' | 'all';
  maxPrice?: number;
}

export interface ActivityResult {
  id: string;
  name: string;
  category: string;
  description: string;
  location: string;
  duration: string;
  pricePerPerson: number;
  currency: string;
  totalPrice: number;
  rating?: number;
  reviewCount?: number;
  highlights?: string[];
  bookingUrl?: string;
  available: boolean;
  dataSource: string;
  date?: string;
}

export interface ActivityProvider {
  name: string;
  search(params: ActivitySearchParams): Promise<ActivityResult[]>;
}
