import { NextRequest, NextResponse } from 'next/server'
import { accommodationProvider } from '@/lib/accommodations'
import type { AccommodationSearchParams } from '@/lib/accommodations'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const destination = searchParams.get('destination')
  const checkIn = searchParams.get('checkIn')
  const checkOut = searchParams.get('checkOut')

  if (!destination || !checkIn || !checkOut) {
    return NextResponse.json(
      { error: 'destination, checkIn, checkOut 파라미터가 필요합니다.' },
      { status: 400 }
    )
  }

  const params: AccommodationSearchParams = {
    destination,
    checkIn,
    checkOut,
    guests: parseInt(searchParams.get('guests') ?? '2', 10),
    rooms: parseInt(searchParams.get('rooms') ?? '1', 10),
    maxPrice: searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!, 10) : undefined,
    type: (searchParams.get('type') as AccommodationSearchParams['type']) ?? 'all',
  }

  try {
    const results = await accommodationProvider.search(params)
    return NextResponse.json({ results, provider: accommodationProvider.name })
  } catch (err) {
    console.error('[/api/accommodations] Error:', err)
    return NextResponse.json({ error: '숙박 정보를 불러오는 데 실패했습니다.' }, { status: 500 })
  }
}
