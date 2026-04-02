export function buildGoogleFlightsUrl(
  from: string,
  to: string,
  date: string,
  returnDate?: string,
): string {
  const base = 'https://www.google.com/flights'
  if (returnDate) {
    return `${base}#flt=${from}.${to}.${date}*${to}.${from}.${returnDate};c:KRW`
  }
  return `${base}#flt=${from}.${to}.${date};c:KRW`
}
