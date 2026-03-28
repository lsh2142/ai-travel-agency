import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/adapter';
import type { BookingSite } from '@/types';

export const runtime = 'nodejs';

export async function GET() {
  const jobs = await getDb().getMonitorJobs();
  return NextResponse.json({ jobs });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      accommodationId: string;
      url: string;
      site: BookingSite;
      checkIn: string;
      checkOut: string;
      guests: number;
      accommodationName: string;
      userId: string;
    };
    const required = ['accommodationId', 'url', 'site', 'checkIn', 'checkOut', 'guests'] as const;
    for (const field of required) {
      if (!body[field]) return NextResponse.json({ error: `${field} is required` }, { status: 400 });
    }

    const jobId = crypto.randomUUID();
    await getDb().saveMonitorJob({
      id: jobId,
      accommodationId: body.accommodationId,
      url: body.url,
      site: body.site,
      checkIn: body.checkIn,
      checkOut: body.checkOut,
      guests: body.guests,
      accommodationName: body.accommodationName ?? '',
      userId: body.userId ?? '',
      status: 'active',
      createdAt: new Date(),
      lastCheckedAt: null,
    });

    return NextResponse.json({
      success: true,
      jobId,
      message: '모니터링 작업이 등록되었습니다. 빈방 발생 시 텔레그램으로 알림을 보내드립니다.',
    });
  } catch (error) {
    console.error('Monitor API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const jobId = request.nextUrl.searchParams.get('jobId');
    if (!jobId) return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
    await getDb().deleteMonitorJob(jobId);
    return NextResponse.json({ success: true, message: '모니터링이 중단되었습니다.' });
  } catch (error) {
    console.error('Monitor DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
