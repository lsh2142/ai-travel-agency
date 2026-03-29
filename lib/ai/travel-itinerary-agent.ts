import type { TravelParams, TripPlan, TripDay, TripDayItem, Alternative, BookingItem } from '@/lib/types/travel'

export const TRAVEL_ITINERARY_SYSTEM_PROMPT = `당신은 전문 여행일정 기획 에이전트입니다. 다음 원칙을 반드시 따르세요.

## 핵심 원칙
1. 사용자가 입력한 목적지, 날짜, 인원, 테마는 절대 임의로 변경하지 않는다.
2. 숙소, 액티비티, 식당 각 항목에 대해 반드시 3개 이상의 대안을 제시한다. 단일 추천만 하는 것은 금지.
3. 예약 가능한 링크는 항상 함께 제공한다.
4. 빈 항목 없이 완전한 Day-by-Day 일정을 제공한다.

## 출력 형식
각 날짜는 다음 JSON 블록으로 출력한다:

[DAY: {"dayNumber": 1, "date": "YYYY-MM-DD", "title": "Day 제목", "items": [
  {
    "time": "09:00",
    "type": "accommodation|activity|restaurant|transport|note",
    "title": "항목 제목",
    "description": "상세 설명",
    "bookingUrl": "https://..."
  }
]}]

각 숙소/액티비티 항목의 대안은 다음 JSON 블록으로 출력한다:

[ALTERNATIVES: {"itemRef": "day1_accommodation", "alternatives": [
  {
    "id": "alt_1",
    "name": "숙소/액티비티 이름",
    "description": "설명 (특징, 위치, 포함사항 등)",
    "price": "가격 (예: ₩150,000/박, ₩25,000/인)",
    "rating": 4.5,
    "bookingUrl": "https://...",
    "category": "accommodation|activity|restaurant|transport"
  },
  {...},
  {...}
]}]

## 예약 링크 가이드라인
- 숙소: booking.com, agoda.com, airbnb.co.kr 딥링크 사용
- 액티비티: klook.com, viator.com 딥링크 사용
- 항공: google.com/flights 딥링크 사용
- 식당: 구글맵 검색 링크 사용

## 중요 제약
- 모든 날짜는 사용자가 제공한 여행 기간 내에 있어야 한다
- 이동 시간과 현실적인 동선을 고려한 일정을 짠다
- 예산이 명시된 경우 해당 예산 범위 내의 대안을 우선 제시한다`

export function buildItineraryRequest(params: TravelParams): string {
  const dateRange = params.dates
    ? `${params.dates.start} ~ ${params.dates.end}`
    : '날짜 미정 (3박4일 기준으로 작성)'
  const themes = params.themes.length > 0 ? params.themes.join(', ') : '일반 여행'

  let prompt = `다음 조건으로 상세한 여행 일정을 작성해주세요.

## 여행 조건
- 목적지: ${params.destination || '미정 (일본 도쿄 추천)'}
- 인원: ${params.people}명
- 여행 기간: ${dateRange}
- 테마: ${themes}
${params.freeText ? `- 추가 요청사항: ${params.freeText}` : ''}

## 요청사항
1. Day-by-Day 완전한 일정을 [DAY: {...}] 블록으로 작성
2. 각 날짜별 숙소, 주요 액티비티, 식당에 대해 반드시 3개 대안을 [ALTERNATIVES: {...}] 블록으로 제공
3. 모든 항목에 실제 예약 가능한 딥링크 URL 포함
4. 현실적인 이동 시간과 동선 고려

지금 바로 일정을 작성해주세요.`

  return prompt
}

export function parseItineraryResponse(response: string): TripPlan {
  const id = crypto.randomUUID()
  const days: TripDay[] = []
  const bookingItems: BookingItem[] = []

  // Parse [DAY: {...}] blocks
  const dayBlockRegex = /\[DAY:\s*(\{[\s\S]*?\})\]/g
  let dayMatch: RegExpExecArray | null

  while ((dayMatch = dayBlockRegex.exec(response)) !== null) {
    try {
      const dayData = JSON.parse(dayMatch[1])
      const items: TripDayItem[] = (dayData.items ?? []).map((item: Record<string, unknown>) => ({
        time: String(item.time ?? ''),
        type: String(item.type ?? 'note') as TripDayItem['type'],
        title: String(item.title ?? ''),
        description: String(item.description ?? ''),
        alternatives: [],
        bookingUrl: item.bookingUrl ? String(item.bookingUrl) : undefined,
      }))

      days.push({
        date: String(dayData.date ?? ''),
        dayNumber: Number(dayData.dayNumber ?? days.length + 1),
        title: String(dayData.title ?? `Day ${days.length + 1}`),
        items,
      })
    } catch {
      // skip malformed blocks
    }
  }

  // Parse [ALTERNATIVES: {...}] blocks and attach to items
  const altBlockRegex = /\[ALTERNATIVES:\s*(\{[\s\S]*?\})\]/g
  let altMatch: RegExpExecArray | null

  while ((altMatch = altBlockRegex.exec(response)) !== null) {
    try {
      const altData = JSON.parse(altMatch[1])
      const alternatives: Alternative[] = (altData.alternatives ?? []).map((a: Record<string, unknown>) => ({
        id: String(a.id ?? crypto.randomUUID()),
        name: String(a.name ?? ''),
        description: String(a.description ?? ''),
        price: String(a.price ?? ''),
        rating: typeof a.rating === 'number' ? a.rating : undefined,
        bookingUrl: String(a.bookingUrl ?? '#'),
        imageUrl: a.imageUrl ? String(a.imageUrl) : undefined,
        category: String(a.category ?? 'accommodation') as Alternative['category'],
      }))

      // Attach alternatives to matching items
      const itemRef = String(altData.itemRef ?? '')
      const refParts = itemRef.split('_')
      if (refParts.length >= 2) {
        const dayNum = parseInt(refParts[0].replace('day', ''))
        const day = days.find((d) => d.dayNumber === dayNum)
        if (day) {
          const itemType = refParts[1] as TripDayItem['type']
          const targetItem = day.items.find((i) => i.type === itemType)
          if (targetItem) {
            targetItem.alternatives = alternatives
          }
        }
      }

      // Build booking items from alternatives
      if (alternatives.length > 0) {
        const firstAlt = alternatives[0]
        const itemType = firstAlt.category === 'accommodation'
          ? 'accommodation'
          : firstAlt.category === 'transport'
          ? 'transport'
          : 'activity'

        bookingItems.push({
          id: crypto.randomUUID(),
          type: itemType as BookingItem['type'],
          name: firstAlt.name,
          bookingUrl: firstAlt.bookingUrl,
          guide: [
            '아래 링크를 탭하세요',
            '날짜·인원을 확인하세요',
            '결제를 진행하세요',
            '예약 확인 번호를 저장하세요',
          ],
          status: 'pending',
          isCompleted: false,
        })
      }
    } catch {
      // skip malformed blocks
    }
  }

  // If parsing found nothing, create a minimal fallback plan
  if (days.length === 0) {
    days.push({
      date: new Date().toISOString().split('T')[0],
      dayNumber: 1,
      title: '일정 생성 중...',
      items: [],
    })
  }

  return {
    id,
    params: {
      destination: '',
      people: 1,
      dates: null,
      themes: [],
      freeText: '',
    },
    days,
    bookingItems,
    status: 'draft',
    createdAt: new Date().toISOString(),
  }
}
