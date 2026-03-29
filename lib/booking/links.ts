import type { FlightResult } from '@/lib/flights/types';

// ─── 항공권 ───────────────────────────────────────────────────────────────────

export function generateGoogleFlightsLink(params: {
  from: string;
  to: string;
  date: string; // YYYY-MM-DD
  returnDate?: string;
  passengers?: number;
}): string {
  const { from, to, date, returnDate, passengers = 1 } = params;
  const leg = returnDate
    ? `${from}.${to}.${date}*${to}.${from}.${returnDate}`
    : `${from}.${to}.${date}`;
  const pax = passengers > 1 ? `;p:${passengers}` : '';
  return `https://www.google.com/flights#flt=${leg};c:KRW;e:1;sd:1;t:f${pax}`;
}

export function generateNaverFlightsLink(params: {
  from: string;
  to: string;
  date: string; // YYYY-MM-DD
  returnDate?: string;
  passengers?: number;
}): string {
  const { from, to, date, returnDate, passengers = 1 } = params;
  const dateCompact = date.replace(/-/g, '');
  const base = `https://flight.naver.com/flights/international/${from}-${to}-${dateCompact}`;
  const qs = new URLSearchParams({ adult: String(passengers) });
  if (returnDate) {
    const returnCompact = returnDate.replace(/-/g, '');
    qs.set('return', returnCompact);
  }
  return `${base}?${qs.toString()}`;
}

export function generateKayakLink(params: {
  from: string;
  to: string;
  date: string; // YYYY-MM-DD
  returnDate?: string;
  passengers?: number;
}): string {
  const { from, to, date, returnDate, passengers = 1 } = params;
  const routeSegment = returnDate
    ? `${from}-${to}/${date}/${returnDate}`
    : `${from}-${to}/${date}`;
  const paxSuffix = passengers > 1 ? `/${passengers}adults` : '';
  return `https://www.kayak.co.kr/flights/${routeSegment}${paxSuffix}`;
}

// ─── 숙박 ─────────────────────────────────────────────────────────────────────

export function generateBookingLink(params: {
  city: string;
  checkin: string; // YYYY-MM-DD
  checkout: string; // YYYY-MM-DD
  guests?: number;
}): string {
  const { city, checkin, checkout, guests = 2 } = params;
  const qs = new URLSearchParams({
    ss: city,
    checkin,
    checkout,
    group_adults: String(guests),
    no_rooms: '1',
  });
  return `https://www.booking.com/searchresults.html?${qs.toString()}`;
}

export function generateAirbnbLink(params: {
  city: string;
  checkin: string; // YYYY-MM-DD
  checkout: string; // YYYY-MM-DD
  guests?: number;
}): string {
  const { city, checkin, checkout, guests = 2 } = params;
  const encodedCity = encodeURIComponent(city);
  const qs = new URLSearchParams({
    checkin,
    checkout,
    adults: String(guests),
  });
  return `https://www.airbnb.co.kr/s/${encodedCity}/homes?${qs.toString()}`;
}

// ─── 렌트카 ───────────────────────────────────────────────────────────────────

export function generateCarRentalLink(params: {
  location: string;
  pickupDate: string; // YYYY-MM-DD
  returnDate: string; // YYYY-MM-DD
}): string {
  const { location, pickupDate, returnDate } = params;
  const qs = new URLSearchParams({
    pickupCity: location,
    pickupDate,
    dropoffDate: returnDate,
  });
  return `https://www.rentalcarkorea.com/car-hire?${qs.toString()}`;
}

// ─── FlightResult → 딥링크 자동 변환 ─────────────────────────────────────────

function extractDate(dateTimeString: string): string {
  // ISO 8601 (2024-09-01T09:00:00) or YYYY-MM-DD
  const match = dateTimeString.match(/(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : dateTimeString;
}

export function flightResultToBookingLinks(flight: FlightResult): {
  googleFlights: string;
  naver: string;
  kayak: string;
} {
  const date = extractDate(flight.departureTime);
  const params = {
    from: flight.origin,
    to: flight.destination,
    date,
  };
  return {
    googleFlights: generateGoogleFlightsLink(params),
    naver: generateNaverFlightsLink(params),
    kayak: generateKayakLink(params),
  };
}
