import { NextRequest, NextResponse } from 'next/server'
import { getMockRentalCars } from '@/lib/rental-cars/mock-provider'
import type { RentalCarSearchParams } from '@/lib/rental-cars/types'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const destination = searchParams.get('destination')
  const pickupDate = searchParams.get('pickupDate')
  const returnDate = searchParams.get('returnDate')

  if (!destination || !pickupDate || !returnDate) {
    return NextResponse.json(
      { error: 'destination, pickupDate, returnDate 파라미터가 필요합니다.' },
      { status: 400 }
    )
  }

  const params: RentalCarSearchParams = {
    destination,
    pickupDate,
    returnDate,
    passengers: searchParams.get('passengers') ? parseInt(searchParams.get('passengers')!, 10) : undefined,
  }

  const results = getMockRentalCars(params)
  return NextResponse.json({ results, source: 'mock' })
}
