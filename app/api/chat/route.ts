import { NextRequest, NextResponse } from 'next/server';
import { TravelPlanner } from '@/lib/ai/planner';
import { getDb } from '@/lib/db/adapter';
import { getServerSession } from '@/lib/auth/supabase-auth';
import type { ChatMessage } from '@/types';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('sessionId');
  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
  }
  const messages = await getDb().getChatSession(sessionId);
  return NextResponse.json({ messages: messages ?? [] });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { messages: ChatMessage[]; userMessage: string; sessionId?: string };
  try {
    body = await request.json() as { messages: ChatMessage[]; userMessage: string; sessionId?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { messages, userMessage, sessionId } = body;
  if (!userMessage?.trim()) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  const planner = new TravelPlanner();
  const encoder = new TextEncoder();
  const db = getDb();

  const stream = new ReadableStream({
    async start(controller) {
      const chunks: string[] = [];
      try {
        for await (const chunk of planner.chatStream(messages ?? [], userMessage)) {
          chunks.push(chunk);
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        controller.enqueue(encoder.encode(`\n[ERROR]: ${errorMessage}`));
        controller.close();
        return;
      }

      if (sessionId) {
        const assistantReply = chunks.join('');
        const newMessages: ChatMessage[] = [
          ...(messages ?? []),
          { role: 'user', content: userMessage, timestamp: new Date() },
          { role: 'assistant', content: assistantReply, timestamp: new Date() },
        ];
        await db.saveChatSession(sessionId, newMessages).catch(() => {
          // Silently ignore save failures
        });
      }
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
