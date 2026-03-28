import { NextRequest, NextResponse } from 'next/server';
import { TravelPlanner } from '@/lib/ai/planner';
import { DbAdapter } from '@/lib/db/adapter';
import type { ChatMessage } from '@/types';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('sessionId');
  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
  }

  const db = new DbAdapter();
  const messages = await db.getChatHistory(sessionId);
  return NextResponse.json({ sessionId, messages });
}

export async function POST(request: NextRequest) {
  let body: { messages: ChatMessage[]; userMessage: string };
  try {
    body = await request.json() as { messages: ChatMessage[]; userMessage: string };
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { messages, userMessage } = body;
  if (!userMessage?.trim()) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  const planner = new TravelPlanner();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of planner.chatStream(messages ?? [], userMessage)) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      } catch (error) {
        console.error('Chat stream error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        controller.enqueue(encoder.encode(`\n[ERROR]: ${errorMessage}`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
