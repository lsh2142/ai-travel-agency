import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import type { Alternative } from '@/lib/types/travel'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const { itemId, type, destination, dates } = await req.json()

  const typeLabel =
    type === 'accommodation' ? '숙소' :
    type === 'activity' ? '액티비티' :
    type === 'restaurant' ? '식당' : '교통'

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `${destination}에서의 ${typeLabel} 대안 3개를 JSON 배열로 제공해주세요.
${dates ? `날짜: ${dates.start} ~ ${dates.end}` : ''}

다음 형식으로만 답해주세요 (마크다운 없이):
[
  {
    "id": "${itemId}_alt_1",
    "name": "이름",
    "description": "설명 (특징, 위치, 포함사항 등 2-3문장)",
    "price": "가격 (예: ₩150,000/박)",
    "rating": 4.5,
    "bookingUrl": "https://...",
    "category": "${type}"
  },
  {...},
  {...}
]`,
      },
    ],
  })

  const content = response.content[0]
  if (content.type !== 'text') {
    return NextResponse.json({ error: 'Unexpected response' }, { status: 500 })
  }

  try {
    const alternatives = JSON.parse(content.text) as Alternative[]
    return NextResponse.json({ itemId, alternatives })
  } catch {
    return NextResponse.json({ error: 'Parse failed' }, { status: 500 })
  }
}
