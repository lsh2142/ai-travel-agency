export interface TravelParams {
  destination: string
  people: number
  dates: { start: string; end: string } | null
  themes: string[]
  freeText: string
}

export interface Alternative {
  id: string
  name: string
  description: string
  price: string
  rating?: number
  bookingUrl: string
  imageUrl?: string
  category: 'accommodation' | 'activity' | 'restaurant' | 'transport'
}

export type BookingStatus = 'booked' | 'pending' | 'monitoring' | 'manual_required' | 'skipped'

export interface BookingItem {
  id: string
  type: 'flight' | 'accommodation' | 'activity' | 'transport'
  name: string
  bookingUrl: string
  guide: string[]
  status: BookingStatus
  isCompleted: boolean
}

export interface TripDay {
  date: string
  dayNumber: number
  title: string
  items: TripDayItem[]
}

export interface TripDayItem {
  time: string
  type: 'accommodation' | 'activity' | 'restaurant' | 'transport' | 'note'
  title: string
  description: string
  alternatives: Alternative[]
  bookingUrl?: string
  selectedAlternativeId?: string
}

export interface TripPlan {
  id: string
  params: TravelParams
  days: TripDay[]
  bookingItems: BookingItem[]
  status: 'draft' | 'confirmed'
  createdAt: string
}

export interface Trip {
  id: string
  title: string
  destination: string
  startDate: string
  endDate: string
  status: 'upcoming' | 'ongoing' | 'completed'
  plan: TripPlan
  coverImageUrl?: string
}
