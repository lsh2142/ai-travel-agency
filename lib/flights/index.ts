import type { FlightProvider } from './types';
import { SerpApiProvider } from './serpapi-provider';
import { AmadeusProvider } from './amadeus-provider';

export * from './types';

// Provider 우선순위:
//   1. FLIGHT_PROVIDER 환경변수로 강제 지정 (amadeus | serpapi)
//   2. AMADEUS_CLIENT_ID 설정 시 → AmadeusProvider
//   3. SERPAPI_KEY 설정 시 → SerpApiProvider (실제 API)
//   4. 아무것도 없으면 → SerpApiProvider (mock 모드)
export function getFlightProvider(): FlightProvider {
  const forced = process.env.FLIGHT_PROVIDER;

  if (forced === 'amadeus') {
    return new AmadeusProvider();
  }

  if (forced === 'serpapi') {
    return new SerpApiProvider();
  }

  if (process.env.AMADEUS_CLIENT_ID) {
    return new AmadeusProvider();
  }

  // SERPAPI_KEY 유무와 관계없이 SerpApiProvider 반환 (키 없으면 mock 모드)
  return new SerpApiProvider();
}

export const flightProvider = getFlightProvider();
