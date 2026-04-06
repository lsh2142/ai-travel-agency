import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import type { TravelParams } from '@/lib/types/travel'

const client = new Anthropic()

function stripJsonFence(raw: string): string {
  return raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
}

export async function POST(req: NextRequest) {
  const { text } = await req.json()
  if (!text || typeof text !== 'string') {
    return NextResponse.json({ error: 'text required' }, { status: 400 })
  }

  const today = new Date().toISOString().split('T')[0]

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: `다음 여행 관련 자유형 텍스트에서 여행 파라미터를 추출해주세요.
오늘 날짜: ${today}

텍스트: "${text}"

다음 JSON 형식으로만 답해주세요 (마크다운 코드블록 없이):
{
  "destination": "목적지 (없으면 빈 문자열)",
  "people": 인원 수 (숫자, 기본값 1),
  "dates": {"start": "YYYY-MM-DD", "end": "YYYY-MM-DD"} 또는 null,
  "themes": ["테마1", "테마2"] (해당하는 것만, 없으면 빈 배열),
  "freeText": "원문 텍스트 그대로"
}

테마 가능 값: 문화탐방, 미식여행, 온천·힐링, 액티비티, 쇼핑, 자연경관, 럭셔리, 가성비

날짜가 "3박4일", "5일" 등 상대적 표현인 경우 오늘부터 계산해서 절대 날짜로 변환하세요.`,
      },
    ],
  })

  const content = response.content[0]
  if (content.type !== 'text') {
    return NextResponse.json({ error: 'Unexpected response' }, { status: 500 })
  }

  try {
    const cleaned = stripJsonFence(content.text)
    const parsed = JSON.parse(cleaned) as TravelParams
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ error: 'Parse failed', raw: content.text }, { status: 500 })
  }
}
