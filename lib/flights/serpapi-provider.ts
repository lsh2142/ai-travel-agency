import type { FlightProvider, FlightSearchParams, FlightResult } from './types';

// 주요 도시 → IATA 코드 매핑
const CITY_TO_IATA: Record<string, string> = {
  // 한국
  서울: 'ICN',
  인천: 'ICN',
  김포: 'GMP',
  부산: 'PUS',
  제주: 'CJU',
  // 일본
  도쿄: 'NRT',
  나리타: 'NRT',
  하네다: 'HND',
  오사카: 'KIX',
  간사이: 'KIX',
  교토: 'KIX',
  나고야: 'NGO',
  삿포로: 'CTS',
  홋카이도: 'CTS',
  후쿠오카: 'FUK',
  오키나와: 'OKA',
  // 동남아시아
  방콕: 'BKK',
  싱가포르: 'SIN',
  하노이: 'HAN',
  호치민: 'SGN',
  발리: 'DPS',
  쿠알라룸푸르: 'KUL',
  마닐라: 'MNL',
  // 기타
  홍콩: 'HKG',
  타이베이: 'TPE',
  베이징: 'PEK',
  상하이: 'PVG',
  시드니: 'SYD',
  뉴욕: 'JFK',
  런던: 'LHR',
  파리: 'CDG',
};

function toIata(code: string): string {
  const upper = code.toUpperCase();
  // 이미 IATA 코드 형식이면 그대로 반환
  if (/^[A-Z]{3}$/.test(upper)) return upper;
  return CITY_TO_IATA[code] ?? code.toUpperCase();
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}시간 ${m}분` : `${h}시간`;
}

// SerpAPI 응답 타입 (필요한 필드만)
interface SerpFlight {
  departure_airport: { id: string; time: string };
  arrival_airport: { id: string; time: string };
  duration: number;
  airline: string;
  flight_number: string;
}

interface SerpFlightGroup {
  flights: SerpFlight[];
  total_duration: number;
  price: number;
  booking_token?: string;
}

interface SerpApiResponse {
  best_flights?: SerpFlightGroup[];
  other_flights?: SerpFlightGroup[];
  error?: string;
}

function parseSerpResults(data: SerpApiResponse, currency: string): FlightResult[] {
  const groups = [...(data.best_flights ?? []), ...(data.other_flights ?? [])];
  const results: FlightResult[] = [];

  for (const group of groups) {
    if (!group.flights?.length) continue;
    const first = group.flights[0];
    const last = group.flights[group.flights.length - 1];
    const stops = group.flights.length - 1;

    results.push({
      airline: first.airline,
      flightNumber: first.flight_number,
      origin: first.departure_airport.id,
      destination: last.arrival_airport.id,
      departureTime: first.departure_airport.time,
      arrivalTime: last.arrival_airport.time,
      duration: formatDuration(group.total_duration),
      price: group.price,
      currency,
      stops,
      bookingUrl: group.booking_token
        ? `https://www.google.com/flights?token=${group.booking_token}`
        : undefined,
    });
  }

  return results.slice(0, 10);
}

function getMockFlights(params: FlightSearchParams): FlightResult[] {
  const origin = toIata(params.origin);
  const destination = toIata(params.destination);
  const date = params.departureDate;

  return [
    {
      airline: '대한항공',
      flightNumber: 'KE701',
      origin,
      destination,
      departureTime: `${date} 08:00`,
      arrivalTime: `${date} 10:30`,
      duration: '2시간 30분',
      price: 280000,
      currency: 'KRW',
      stops: 0,
    },
    {
      airline: '아시아나항공',
      flightNumber: 'OZ101',
      origin,
      destination,
      departureTime: `${date} 10:30`,
      arrivalTime: `${date} 13:00`,
      duration: '2시간 30분',
      price: 260000,
      currency: 'KRW',
      stops: 0,
    },
    {
      airline: '진에어',
      flightNumber: 'LJ301',
      origin,
      destination,
      departureTime: `${date} 14:00`,
      arrivalTime: `${date} 16:30`,
      duration: '2시간 30분',
      price: 180000,
      currency: 'KRW',
      stops: 0,
    },
  ];
}

export class SerpApiProvider implements FlightProvider {
  name = 'serpapi';

  async search(params: FlightSearchParams): Promise<FlightResult[]> {
    const apiKey = process.env.SERPAPI_KEY || process.env.SERP_API_KEY;

    if (!apiKey) {
      console.warn('[SerpApiProvider] SERPAPI_KEY not set — returning mock data');
      return getMockFlights(params);
    }

    const origin = toIata(params.origin);
    const destination = toIata(params.destination);

    const searchParams = new URLSearchParams({
      engine: 'google_flights',
      departure_id: origin,
      arrival_id: destination,
      outbound_date: params.departureDate,
      currency: 'KRW',
      hl: 'ko',
      api_key: apiKey,
    });

    if (params.returnDate) {
      searchParams.set('return_date', params.returnDate);
      searchParams.set('type', '1'); // 왕복
    } else {
      searchParams.set('type', '2'); // 편도
    }

    if (params.passengers && params.passengers > 1) {
      searchParams.set('adults', String(params.passengers));
    }

    if (params.cabin === 'business') {
      searchParams.set('travel_class', '2');
    } else if (params.cabin === 'first') {
      searchParams.set('travel_class', '3');
    }

    const url = `https://serpapi.com/search.json?${searchParams.toString()}`;
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`SerpAPI request failed: ${res.status} ${res.statusText}`);
    }

    const data = await res.json() as SerpApiResponse;

    if (data.error) {
      throw new Error(`SerpAPI error: ${data.error}`);
    }

    return parseSerpResults(data, 'KRW');
  }
}
