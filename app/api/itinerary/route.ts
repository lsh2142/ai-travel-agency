import { NextRequest, NextResponse } from 'next/server';
import type { TripItinerary } from '@/lib/itinerary/types';
import { itineraryServerStore } from '@/lib/itinerary/server-store';

export const runtime = 'nodejs';

const itineraryStore = itineraryServerStore;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function GET() {
  const itineraries = Array.from(itineraryStore.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  return NextResponse.json({ itineraries });
}

export async function POST(request: NextRequest) {
  let body: Omit<TripItinerary, 'id' | 'createdAt' | 'updatedAt'>;
  try {
    body = await request.json() as Omit<TripItinerary, 'id' | 'createdAt' | 'updatedAt'>;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!body.title?.trim() || !body.startDate?.trim() || !body.endDate?.trim()) {
    return NextResponse.json(
      { error: 'title, startDate, endDate are required' },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();
  const itinerary: TripItinerary = {
    ...body,
    id: generateId(),
    items: body.items ?? [],
    createdAt: now,
    updatedAt: now,
  };

  itineraryStore.set(itinerary.id, itinerary);
  return NextResponse.json({ itinerary }, { status: 201 });
}
