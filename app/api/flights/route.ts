import { NextRequest, NextResponse } from 'next/server';
import { flightProvider } from '@/lib/flights';
import type { FlightSearchParams } from '@/lib/flights';
import { getMockFlights } from '@/lib/mock/flights';
import { fetchFlights } from '@/lib/flights/serpapi-client';
import { sortFlightsDefault } from '@/lib/flights/sort-flights';
import { getCityIATA } from '@/lib/flights/iata-map';
import { buildGoogleFlightsUrl } from '@/lib/flights/booking-url';
import type { FlightApiResponse } from '@/lib/flights/flight-option';

export const runtime = 'nodejs';

// GET /api/flights?from=ICN&to=NRT&date=2026-04-10&returnDate=2026-04-14&class=economy
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const from = searchParams.get('from') || 'ICN';
  const toRaw = searchParams.get('to');
  const date = searchParams.get('date');
  const returnDate = searchParams.get('returnDate') ?? undefined;

  if (!toRaw || !date) {
    return NextResponse.json(
      { error: 'missing_params', message: 'from, to, date 필수' },
      { status: 422 },
    );
  }

  // 도시명이면 IATA 코드로 변환
  const to = /^[A-Z]{3}$/.test(toRaw) ? toRaw : (getCityIATA(toRaw) ?? toRaw.toUpperCase());

  const useSerpApi = Boolean(process.env.SERPAPI_API_KEY);
  const source: FlightApiResponse['source'] = useSerpApi ? 'serpapi' : 'mock';

  // 아웃바운드 항공편 조회
  const outboundRaw = useSerpApi
    ? await fetchFlights(from, to, date, returnDate)
    : getMockFlights(from, to, date).map((f) => ({
        ...f,
        bookingUrl: buildGoogleFlightsUrl(f.departure.airport, f.arrival.airport, date, returnDate),
      }));

  if (outboundRaw.length === 0) {
    return NextResponse.json(
      { error: 'no_flights', message: '해당 구간 항공편 없음' },
      { status: 404 },
    );
  }

  const outbound = sortFlightsDefault(outboundRaw);

  const response: FlightApiResponse = {
    outbound,
    currency: 'KRW',
    source,
  };

  if (returnDate) {
    const returnRaw = useSerpApi
      ? await fetchFlights(to, from, returnDate)
      : getMockFlights(to, from, returnDate).map((f) => ({
          ...f,
          bookingUrl: buildGoogleFlightsUrl(
            f.departure.airport,
            f.arrival.airport,
            returnDate,
            date,
          ),
        }));
    response.return = sortFlightsDefault(returnRaw);
  }

  return NextResponse.json(response);
}

// POST — 기존 provider 기반 엔드포인트 유지
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
