import { describe, it, expect } from 'vitest';
import {
  generateGoogleFlightsLink,
  generateNaverFlightsLink,
  generateKayakLink,
  generateBookingLink,
  generateAirbnbLink,
  generateCarRentalLink,
  flightResultToBookingLinks,
} from './links';
import type { FlightResult } from '@/lib/flights/types';

describe('generateGoogleFlightsLink', () => {
  it('generates one-way link', () => {
    const url = generateGoogleFlightsLink({ from: 'ICN', to: 'NRT', date: '2024-09-01' });
    expect(url).toContain('google.com/flights');
    expect(url).toContain('ICN.NRT.2024-09-01');
  });

  it('generates round-trip link', () => {
    const url = generateGoogleFlightsLink({
      from: 'ICN', to: 'NRT', date: '2024-09-01', returnDate: '2024-09-08',
    });
    expect(url).toContain('ICN.NRT.2024-09-01*NRT.ICN.2024-09-08');
  });

  it('includes passenger count when > 1', () => {
    const url = generateGoogleFlightsLink({ from: 'ICN', to: 'NRT', date: '2024-09-01', passengers: 2 });
    expect(url).toContain('p:2');
  });

  it('omits passenger suffix for 1 passenger', () => {
    const url = generateGoogleFlightsLink({ from: 'ICN', to: 'NRT', date: '2024-09-01', passengers: 1 });
    expect(url).not.toContain('p:');
  });
});

describe('generateNaverFlightsLink', () => {
  it('generates one-way link with compact date', () => {
    const url = generateNaverFlightsLink({ from: 'ICN', to: 'NRT', date: '2024-09-01' });
    expect(url).toContain('flight.naver.com');
    expect(url).toContain('ICN-NRT-20240901');
    expect(url).toContain('adult=1');
  });

  it('includes return date for round-trip', () => {
    const url = generateNaverFlightsLink({
      from: 'ICN', to: 'NRT', date: '2024-09-01', returnDate: '2024-09-08',
    });
    expect(url).toContain('return=20240908');
  });

  it('uses custom passenger count', () => {
    const url = generateNaverFlightsLink({ from: 'ICN', to: 'NRT', date: '2024-09-01', passengers: 3 });
    expect(url).toContain('adult=3');
  });
});

describe('generateKayakLink', () => {
  it('generates one-way link', () => {
    const url = generateKayakLink({ from: 'ICN', to: 'NRT', date: '2024-09-01' });
    expect(url).toContain('kayak.co.kr/flights/ICN-NRT/2024-09-01');
  });

  it('generates round-trip link', () => {
    const url = generateKayakLink({
      from: 'ICN', to: 'NRT', date: '2024-09-01', returnDate: '2024-09-08',
    });
    expect(url).toContain('ICN-NRT/2024-09-01/2024-09-08');
  });

  it('appends adults suffix for multiple passengers', () => {
    const url = generateKayakLink({ from: 'ICN', to: 'NRT', date: '2024-09-01', passengers: 2 });
    expect(url).toContain('2adults');
  });
});

describe('generateBookingLink', () => {
  it('generates booking.com search URL', () => {
    const url = generateBookingLink({ city: 'Tokyo', checkin: '2024-09-01', checkout: '2024-09-08' });
    expect(url).toContain('booking.com');
    expect(url).toContain('ss=Tokyo');
    expect(url).toContain('checkin=2024-09-01');
    expect(url).toContain('checkout=2024-09-08');
    expect(url).toContain('group_adults=2');
  });

  it('uses custom guest count', () => {
    const url = generateBookingLink({ city: 'Osaka', checkin: '2024-09-01', checkout: '2024-09-03', guests: 4 });
    expect(url).toContain('group_adults=4');
  });
});

describe('generateAirbnbLink', () => {
  it('generates airbnb search URL', () => {
    const url = generateAirbnbLink({ city: 'Tokyo', checkin: '2024-09-01', checkout: '2024-09-08' });
    expect(url).toContain('airbnb.co.kr');
    expect(url).toContain('Tokyo');
    expect(url).toContain('checkin=2024-09-01');
    expect(url).toContain('checkout=2024-09-08');
    expect(url).toContain('adults=2');
  });

  it('encodes city name with spaces', () => {
    const url = generateAirbnbLink({ city: 'New York', checkin: '2024-09-01', checkout: '2024-09-05' });
    expect(url).toContain('New%20York');
  });
});

describe('generateCarRentalLink', () => {
  it('generates rental car URL', () => {
    const url = generateCarRentalLink({ location: 'Tokyo', pickupDate: '2024-09-01', returnDate: '2024-09-08' });
    expect(url).toContain('rentalcarkorea.com');
    expect(url).toContain('pickupCity=Tokyo');
    expect(url).toContain('pickupDate=2024-09-01');
    expect(url).toContain('dropoffDate=2024-09-08');
  });
});

describe('flightResultToBookingLinks', () => {
  const flight: FlightResult = {
    airline: 'Korean Air',
    flightNumber: 'KE701',
    origin: 'ICN',
    destination: 'NRT',
    departureTime: '2024-09-01T09:00:00',
    arrivalTime: '2024-09-01T11:30:00',
    duration: '2h 30m',
    price: 250000,
    currency: 'KRW',
    stops: 0,
  };

  it('returns links for all three services', () => {
    const links = flightResultToBookingLinks(flight);
    expect(links).toHaveProperty('googleFlights');
    expect(links).toHaveProperty('naver');
    expect(links).toHaveProperty('kayak');
  });

  it('extracts date correctly from ISO departureTime', () => {
    const links = flightResultToBookingLinks(flight);
    expect(links.googleFlights).toContain('ICN.NRT.2024-09-01');
    expect(links.naver).toContain('ICN-NRT-20240901');
    expect(links.kayak).toContain('ICN-NRT/2024-09-01');
  });

  it('handles plain date string in departureTime', () => {
    const links = flightResultToBookingLinks({ ...flight, departureTime: '2024-10-15' });
    expect(links.googleFlights).toContain('2024-10-15');
  });
});
