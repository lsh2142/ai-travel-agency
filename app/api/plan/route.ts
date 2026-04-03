import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { TRAVEL_ITINERARY_SYSTEM_PROMPT, buildItineraryRequest } from '@/lib/ai/travel-itinerary-agent'
import type { TravelParams } from '@/lib/types/travel'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const params = (await req.json()) as TravelParams

  const userMessage = buildItineraryRequest(params)

  const stream = client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 16000, // 8192 → 16000: 5일 여행 + 대안 3개씩 ~12,000 토큰 필요
    system: TRAVEL_ITINERARY_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  })

  const encoder = new TextEncoder()

  const readableStream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(event.delta.text))
          }
        }
        controller.close()
      } catch (err) {
        controller.error(err)
      }
    },
  })

  return new Response(readableStream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
    },
  })
}
