import type { AvailabilityResult } from '@/types';

export function parseRakutenAvailability(html: string): AvailabilityResult {
  const hasNoPlan = html.includes('noplan-area') || html.includes('no-plan');
  const hasPlan = html.includes('plan-list-item') || html.includes('plan-item');

  const priceMatch = html.match(/¥([\d,]+)/);
  const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, ''), 10) : undefined;

  return {
    available: !hasNoPlan && hasPlan,
    price,
    checkedAt: new Date(),
  };
}

export function buildRakutenUrl(hotelNo: string, checkIn: string, checkOut: string, guests: number): string {
  const formattedCheckIn = checkIn.replace(/-/g, '');
  const formattedCheckOut = checkOut.replace(/-/g, '');
  return `https://travel.rakuten.co.jp/HOTEL/${hotelNo}/plan.html?f_teiin=${guests}&f_s1=${formattedCheckIn}&f_e1=${formattedCheckOut}`;
}
