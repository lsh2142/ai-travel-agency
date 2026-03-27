import type { AvailabilityResult } from '@/types';

export function parseHitouAvailability(html: string): AvailabilityResult {
  const isFull = html.includes('満室') || html.includes('full-text');
  const hasReserveBtn = html.includes('reserve-btn') && !html.includes('reserve-btn disabled');
  const priceMatch = html.match(/(\d{1,3}(?:,\d{3})+|\d+)円/);
  const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, ''), 10) : undefined;
  return { available: !isFull && hasReserveBtn, price, checkedAt: new Date() };
}

export function buildHitouUrl(facilityId: string, checkIn: string, checkOut: string, guests: number): string {
  return `https://www.hitou.or.jp/facility/${facilityId}?checkin=${checkIn}&checkout=${checkOut}&guests=${guests}`;
}
