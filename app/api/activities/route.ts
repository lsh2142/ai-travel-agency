import { NextRequest, NextResponse } from 'next/server'
import { activityProvider } from '@/lib/activities'
import type { ActivitySearchParams, ActivityCategory } from '@/lib/activities'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const destination = searchParams.get('destination')

  if (!destination) {
    return NextResponse.json(
      { error: 'destination 파라미터가 필요합니다.' },
      { status: 400 }
    )
  }

  const params: ActivitySearchParams = {
    destination,
    date: searchParams.get('date') ?? undefined,
    guests: parseInt(searchParams.get('guests') ?? '2', 10),
    category: (searchParams.get('category') as ActivityCategory | 'all') ?? 'all',
    maxPrice: searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!, 10) : undefined,
  }

  try {
    const results = await activityProvider.search(params)
    return NextResponse.json({ results, provider: activityProvider.name })
  } catch (err) {
    console.error('[/api/activities] Error:', err)
    return NextResponse.json({ error: '액티비티 정보를 불러오는 데 실패했습니다.' }, { status: 500 })
  }
}
