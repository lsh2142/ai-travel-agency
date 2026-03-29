import { NextRequest, NextResponse } from 'next/server';
import type { FlightResult } from '@/lib/flights/types';
import type { ItineraryItem, TripItinerary } from '@/lib/itinerary/types';
import { flightResultToBookingLinks } from '@/lib/booking/links';
import { itineraryServerStore } from '@/lib/itinerary/server-store';

export const runtime = 'nodejs';

const itineraryStore = itineraryServerStore;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface AddItemBody {
  type: ItineraryItem['type'];
  date: string;
  title?: string;
  description?: string;
  price?: number;
  currency?: string;
  flightData?: FlightResult;
  bookingUrl?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const itinerary = itineraryStore.get(id);
  if (!itinerary) {
    return NextResponse.json({ error: 'Itinerary not found' }, { status: 404 });
  }

  let body: AddItemBody;
  try {
    body = await request.json() as AddItemBody;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!body.type || !body.date) {
    return NextResponse.json({ error: 'type and date are required' }, { status: 400 });
  }

  // Auto-generate booking links when flight data is provided
  let bookingUrl = body.bookingUrl;
  let title = body.title;

  if (body.flightData) {
    const links = flightResultToBookingLinks(body.flightData);
    bookingUrl = bookingUrl ?? links.googleFlights;
    title =
      title ??
      `${body.flightData.airline} ${body.flightData.flightNumber} · ${body.flightData.origin}→${body.flightData.destination}`;
  }

  if (!title?.trim()) {
    return NextResponse.json({ error: 'title is required (or provide flightData)' }, { status: 400 });
  }

  const newItem: ItineraryItem = {
    id: generateId(),
    type: body.type,
    date: body.date,
    title,
    description: body.description,
    bookingStatus: 'planned',
    bookingUrl,
    price: body.price,
    currency: body.currency,
    flightData: body.flightData,
  };

  const updated: TripItinerary = {
    ...itinerary,
    items: [...itinerary.items, newItem],
    updatedAt: new Date().toISOString(),
  };
  itineraryStore.set(id, updated);

  return NextResponse.json({ item: newItem }, { status: 201 });
}
