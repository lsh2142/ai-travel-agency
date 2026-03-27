export interface TravelRequest {
  destination: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  budget?: number;
  preferences?: string[];
}

export interface TravelPlan {
  id: string;
  destination: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  itinerary: ItineraryDay[];
  accommodations: AccommodationOption[];
  totalEstimatedCost: number;
  createdAt: Date;
}

export interface ItineraryDay {
  day: number;
  date: string;
  activities: Activity[];
}

export interface Activity {
  time: string;
  name: string;
  description: string;
  location: string;
  estimatedCost: number;
}

export interface AccommodationOption {
  id: string;
  name: string;
  site: BookingSite;
  url: string;
  pricePerNight: number;
  available: boolean;
  rating?: number;
}

export type BookingSite = 'jalan' | 'rakuten' | 'hitou';

export interface MonitorJob {
  id: string;
  accommodationId: string;
  url: string;
  site: BookingSite;
  checkIn: string;
  checkOut: string;
  guests: number;
  userId: string;
  status: MonitorStatus;
  createdAt: Date;
  lastCheckedAt?: Date;
}

export type MonitorStatus = 'active' | 'paused' | 'completed' | 'failed';

export interface AvailabilityResult {
  available: boolean;
  price?: number;
  rooms?: number;
  checkedAt: Date;
  error?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface TelegramNotification {
  chatId: string;
  message: string;
  parseMode?: 'HTML' | 'Markdown';
}

export interface NotificationResult {
  success: boolean;
  messageId?: number;
  error?: string;
}
