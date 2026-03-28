import { NextRequest, NextResponse } from 'next/server';
import type { BookingSite } from '@/types';
import { MonitorScheduler } from '@/lib/monitor/scheduler';

export const runtime = 'nodejs';

const scheduler = new MonitorScheduler();

export async function GET(_request: NextRequest) {
  try {
    const jobs = await scheduler.listJobs();
    return NextResponse.json({ jobs });
  } catch (error) {
    console.error('Monitor GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { accommodationId: string; url: string; site: BookingSite; checkIn: string; checkOut: string; guests: number; accommodationName: string; userId: string };
    const required = ['accommodationId', 'url', 'site', 'checkIn', 'checkOut', 'guests'];
    for (const field of required) {
      if (!body[field as keyof typeof body]) return NextResponse.json({ error: `${field} is required` }, { status: 400 });
    }
    const jobId = crypto.randomUUID();
    return NextResponse.json({ success: true, jobId, message: '모니터링 작업이 등록되었습니다. 빈방 발생 시 텔레그램으로 알림을 보내드립니다.' });
  } catch (error) {
    console.error('Monitor API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    if (!jobId) return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
    return NextResponse.json({ success: true, message: '모니터링이 중단되었습니다.' });
  } catch (error) {
    console.error('Monitor DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
