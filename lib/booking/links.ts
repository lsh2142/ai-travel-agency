import type { FlightResult } from '@/lib/flights/types';
import type { BookingItem } from '@/lib/types/travel';

// ─── 스펙 v1.1 딥링크 빌더 ────────────────────────────────────────────────────

export function buildGoogleFlightsUrl(params: {
  origin: string
  destination: string
  date: string
  returnDate?: string
  passengers: number
}): string {
  const { origin, destination, date, returnDate, passengers } = params
  const leg = returnDate
    ? `${origin}.${destination}.${date}*${destination}.${origin}.${returnDate}`
    : `${origin}.${destination}.${date}`
  const pax = passengers > 1 ? `;p:${passengers}` : ''
  return `https://www.google.com/flights#flt=${leg};c:KRW;e:1;sd:1;t:f${pax}`
}

export function buildBookingUrl(params: {
  destination: string
  checkIn: string
  checkOut: string
  guests: number
}): string {
  const qs = new URLSearchParams({
    ss: params.destination,
    checkin: params.checkIn,
    checkout: params.checkOut,
    group_adults: String(params.guests),
    no_rooms: '1',
  })
  return `https://www.booking.com/searchresults.html?${qs.toString()}`
}

export function buildAgodaUrl(params: {
  destination: string
  checkIn: string
  checkOut: string
  rooms: number
}): string {
  const qs = new URLSearchParams({
    city: params.destination,
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    rooms: String(params.rooms),
    adults: String(params.rooms * 2),
  })
  return `https://www.agoda.com/search?${qs.toString()}`
}

export function buildKlookUrl(params: { destination: string; keyword: string }): string {
  const qs = new URLSearchParams({
    query: `${params.destination} ${params.keyword}`,
  })
  return `https://www.klook.com/ko/search/?${qs.toString()}`
}

export function buildViatorUrl(params: { destination: string; keyword: string }): string {
  const encoded = encodeURIComponent(`${params.destination} ${params.keyword}`)
  return `https://www.viator.com/ko-KR/search?q=${encoded}`
}

export function buildManualGuide(
  type: BookingItem['type'],
  params: Record<string, string>
): string[] {
  switch (type) {
    case 'flight':
      return [
        '아래 구글 플라이트 링크를 탭하세요',
        `출발: ${params.origin ?? ''} → 도착: ${params.destination ?? ''}`,
        `날짜: ${params.date ?? ''}${params.returnDate ? ` / 귀국: ${params.returnDate}` : ''}`,
        '원하는 항공편을 선택해 항공사 사이트에서 결제하세요',
        '예약 확인 이메일과 PNR 번호를 저장하세요',
      ]
    case 'accommodation':
      return [
        '아래 예약 링크를 탭하세요',
        `체크인: ${params.checkIn ?? ''} / 체크아웃: ${params.checkOut ?? ''}`,
        `인원: ${params.guests ?? ''}명`,
        '날짜·인원을 확인 후 결제를 진행하세요',
        '예약 확인 번호를 메모해두세요',
      ]
    case 'activity':
      return [
        '아래 Klook / Viator 링크를 탭하세요',
        `액티비티: ${params.name ?? ''}`,
        '날짜와 인원을 선택하세요',
        '결제 완료 후 바우처를 다운로드하세요',
      ]
    case 'transport':
      return [
        `출발지: ${params.origin ?? ''} → 목적지: ${params.destination ?? ''}`,
        '현지 교통편(JR패스, 버스 등)을 예약하세요',
        '예약 확인증을 캡처해두세요',
      ]
    default:
      return ['아래 링크에서 직접 예약하세요', '예약 확인 번호를 저장하세요']
  }
}

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
