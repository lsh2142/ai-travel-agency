export const CITY_TO_IATA_MAP: Record<string, string> = {
  // 일본
  '도쿄': 'TYO',
  '나리타': 'NRT',
  '하네다': 'HND',
  '오사카': 'OSA',
  '간사이': 'KIX',
  '교토': 'KIX',
  '삿포로': 'CTS',
  '홋카이도': 'CTS',
  '후쿠오카': 'FUK',
  '나고야': 'NGO',
  '오키나와': 'OKA',
  '히로시마': 'HIJ',
  // 동남아
  '방콕': 'BKK',
  '푸켓': 'HKT',
  '치앙마이': 'CNX',
  '싱가포르': 'SIN',
  '쿠알라룸푸르': 'KUL',
  '발리': 'DPS',
  '자카르타': 'CGK',
  '호치민': 'SGN',
  '하노이': 'HAN',
  '다낭': 'DAD',
  '마닐라': 'MNL',
  '세부': 'CEB',
  '양곤': 'RGN',
  '프놈펜': 'PNH',
  // 중국/홍콩/대만
  '베이징': 'PEK',
  '상하이': 'SHA',
  '광저우': 'CAN',
  '홍콩': 'HKG',
  '타이베이': 'TPE',
  '마카오': 'MFM',
  '청두': 'CTU',
  // 유럽
  '파리': 'CDG',
  '런던': 'LHR',
  '로마': 'FCO',
  '바르셀로나': 'BCN',
  '암스테르담': 'AMS',
  '프랑크푸르트': 'FRA',
  '마드리드': 'MAD',
  '빈': 'VIE',
  '취리히': 'ZRH',
  '프라하': 'PRG',
  // 미주
  '뉴욕': 'JFK',
  '로스앤젤레스': 'LAX',
  '샌프란시스코': 'SFO',
  '시카고': 'ORD',
  '라스베이거스': 'LAS',
  '하와이': 'HNL',
  '밴쿠버': 'YVR',
  '토론토': 'YYZ',
  // 기타
  '두바이': 'DXB',
  '이스탄불': 'IST',
  '시드니': 'SYD',
  '멜버른': 'MEL',
  // 한국
  '서울': 'ICN',
  '인천': 'ICN',
  '김포': 'GMP',
  '부산': 'PUS',
  '김해': 'PUS',
  '제주': 'CJU',
  '대구': 'TAE',
  '광주': 'KWJ',
  '청주': 'CJJ',
}

export function getCityIATA(cityName: string): string | null {
  if (!cityName) return null
  // 이미 IATA 코드 형식 (3자리 대문자)이면 그대로 반환
  if (/^[A-Z]{3}$/.test(cityName)) return cityName
  // 한국어 도시명 매핑 시도
  if (CITY_TO_IATA_MAP[cityName]) return CITY_TO_IATA_MAP[cityName]
  // 첫 단어만 추출 후 재시도 ("도쿄 3박4일" → "도쿄")
  const firstWord = cityName.split(/[\s,와과]+/)[0].trim()
  return CITY_TO_IATA_MAP[firstWord] ?? null
}
