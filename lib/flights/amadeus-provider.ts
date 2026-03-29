import type { FlightProvider, FlightSearchParams, FlightResult } from './types';

// Amadeus for Developers: https://developers.amadeus.com
// 필요 환경변수: AMADEUS_CLIENT_ID, AMADEUS_CLIENT_SECRET
// 현재는 stub — 키 설정 후 구현 완성

export class AmadeusProvider implements FlightProvider {
  name = 'amadeus';

  async search(_params: FlightSearchParams): Promise<FlightResult[]> {
    throw new Error(
      'Amadeus provider not yet implemented. Set AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET to enable.',
    );
  }
}
