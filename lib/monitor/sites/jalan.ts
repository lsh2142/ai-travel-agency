import type { AvailabilityResult } from '@/types';

export function parseJalanAvailability(html: string): AvailabilityResult {
  const hasNoVacancy = html.includes('満室') || html.includes('no-vacancy') || html.includes('empty-plan');
  const hasPlan = html.includes('planList') || html.includes('plan-item');

  const priceMatch = html.match(/￥([\d,]+)/);
  const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, ''), 10) : undefined;

  return {
    available: !hasNoVacancy && hasPlan,
    price,
    checkedAt: new Date(),
  };
}

export function buildJalanUrl(hotelId: string, checkIn: string, checkOut: string, guests: number): string {
  const [ciYear, ciMonth, ciDay] = checkIn.split('-');
  const [coYear, coMonth, coDay] = checkOut.split('-');
  return `https://www.jalan.net/yad${hotelId}/plan/list/?stayCount=1&adultNum=${guests}&checkInDate=${ciYear}/${ciMonth}/${ciDay}&checkOutDate=${coYear}/${coMonth}/${coDay}`;
}
