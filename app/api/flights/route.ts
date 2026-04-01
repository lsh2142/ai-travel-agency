import { NextRequest, NextResponse } from 'next/server';
import { flightProvider } from '@/lib/flights';
import type { FlightSearchParams } from '@/lib/flights';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  let params: FlightSearchParams;
  try {
    params = await request.json() as FlightSearchParams;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!params.origin?.trim() || !params.destination?.trim() || !params.departureDate?.trim()) {
    return NextResponse.json(
      { error: 'origin, destination, departureDate are required' },
      { status: 400 },
    );
  }

  try {
    const flights = await flightProvider.search(params);
    return NextResponse.json({ flights, provider: flightProvider.name });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Flight search failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
