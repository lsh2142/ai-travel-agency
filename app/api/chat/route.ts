import { NextRequest, NextResponse } from 'next/server';
import { TravelPlanner } from '@/lib/ai/planner';
import type { ChatMessage } from '@/types';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { messages: ChatMessage[]; userMessage: string };
    const { messages, userMessage } = body;
    if (!userMessage?.trim()) return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    const planner = new TravelPlanner();
    const response = await planner.chat(messages ?? [], userMessage);
    return NextResponse.json({ message: response });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
