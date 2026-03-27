import Anthropic from '@anthropic-ai/sdk';
import { TRAVEL_PLANNER_SYSTEM_PROMPT } from './prompts';
import type { TravelRequest, TravelPlan, ChatMessage } from '@/types';

export class TravelPlanner {
  private client: Anthropic;
  private model = 'claude-sonnet-4-6';

  constructor(apiKey?: string) {
    this.client = new Anthropic({
      apiKey: apiKey ?? process.env.ANTHROPIC_API_KEY,
    });
  }

  async chat(messages: ChatMessage[], userMessage: string): Promise<string> {
    const formattedMessages = [
      ...messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: userMessage },
    ];

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      system: TRAVEL_PLANNER_SYSTEM_PROMPT,
      messages: formattedMessages,
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude API');
    }

    return content.text;
  }

  async *chatStream(messages: ChatMessage[], userMessage: string): AsyncGenerator<string> {
    const formattedMessages = [
      ...messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: userMessage },
    ];

    const stream = this.client.messages.stream({
      model: this.model,
      max_tokens: 4096,
      system: TRAVEL_PLANNER_SYSTEM_PROMPT,
      messages: formattedMessages,
    });

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        yield event.delta.text;
      }
    }
  }

  async generateTravelPlan(request: TravelRequest): Promise<TravelPlan> {
    const prompt = `다음 여행 조건으로 상세한 여행 계획을 JSON 형식으로 작성해주세요:
- 목적지: ${request.destination}
- 체크인: ${request.checkIn}
- 체크아웃: ${request.checkOut}
- 인원: ${request.guests}명
${request.budget ? `- 예산: ${request.budget.toLocaleString()}원` : ''}
${request.preferences?.length ? `- 선호사항: ${request.preferences.join(', ')}` : ''}

응답은 반드시 다음 JSON 구조로만 답해주세요 (마크다운 코드블록 없이):
{
  "destination": "목적지",
  "itinerary": [{"day": 1, "date": "YYYY-MM-DD", "activities": [{"time": "HH:MM", "name": "활동명", "description": "설명", "location": "위치", "estimatedCost": 0}]}],
  "accommodations": [{"id": "uuid", "name": "숙소명", "site": "jalan", "url": "https://...", "pricePerNight": 0, "available": true, "rating": 4.5}],
  "totalEstimatedCost": 0
}`;

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      system: TRAVEL_PLANNER_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude API');
    }

    let parsed: Partial<TravelPlan>;
    try {
      parsed = JSON.parse(content.text);
    } catch {
      throw new Error(`Failed to parse travel plan JSON: ${content.text.substring(0, 200)}`);
    }

    return {
      id: crypto.randomUUID(),
      destination: parsed.destination ?? request.destination,
      checkIn: request.checkIn,
      checkOut: request.checkOut,
      guests: request.guests,
      itinerary: parsed.itinerary ?? [],
      accommodations: parsed.accommodations ?? [],
      totalEstimatedCost: parsed.totalEstimatedCost ?? 0,
      createdAt: new Date(),
    };
  }

  async extractTravelRequest(userMessage: string): Promise<Partial<TravelRequest>> {
    const prompt = `다음 메시지에서 여행 정보를 추출해서 JSON으로만 답해주세요 (마크다운 없이):
"${userMessage}"

{
  "destination": "목적지 (없으면 null)",
  "checkIn": "YYYY-MM-DD (없으면 null)",
  "checkOut": "YYYY-MM-DD (없으면 null)",
  "guests": 1,
  "budget": null,
  "preferences": []
}`;

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    try {
      return JSON.parse(content.text);
    } catch {
      return {};
    }
  }
}
