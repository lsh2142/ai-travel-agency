import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TravelPlanner } from '@/lib/ai/planner';

const mockCreate = vi.fn();

vi.mock('@anthropic-ai/sdk', () => {
  class MockAnthropic {
    messages = { create: mockCreate };
    constructor(_opts?: unknown) {}
  }
  return { default: MockAnthropic };
});

describe('TravelPlanner', () => {
  let planner: TravelPlanner;

  beforeEach(() => {
    vi.clearAllMocks();
    planner = new TravelPlanner('test-api-key');
  });

  describe('chat', () => {
    it('should return assistant message text', async () => {
      mockCreate.mockResolvedValueOnce({ content: [{ type: 'text', text: '교토는 아름다운 도시입니다.' }] });
      const result = await planner.chat([], '교토 여행 추천해줘');
      expect(result).toBe('교토는 아름다운 도시입니다.');
    });

    it('should throw on non-text response', async () => {
      mockCreate.mockResolvedValueOnce({ content: [{ type: 'tool_use', id: 'x', name: 'tool', input: {} }] });
      await expect(planner.chat([], 'test')).rejects.toThrow('Unexpected response type');
    });

    it('should include previous messages in context', async () => {
      mockCreate.mockResolvedValueOnce({ content: [{ type: 'text', text: 'response' }] });
      const messages = [
        { role: 'user' as const, content: 'hello', timestamp: new Date() },
        { role: 'assistant' as const, content: 'hi', timestamp: new Date() },
      ];
      await planner.chat(messages, 'new message');
      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({ role: 'user', content: 'hello' }),
          expect.objectContaining({ role: 'assistant', content: 'hi' }),
          expect.objectContaining({ role: 'user', content: 'new message' }),
        ]),
      }));
    });
  });

  describe('generateTravelPlan', () => {
    it('should parse valid JSON response into TravelPlan', async () => {
      const mockPlan = {
        destination: '교토',
        itinerary: [{ day: 1, date: '2024-04-01', activities: [{ time: '10:00', name: '금각사', description: '세계유산', location: '교토', estimatedCost: 500 }] }],
        accommodations: [{ id: 'acc-1', name: '교토 료칸', site: 'jalan', url: 'https://example.com', pricePerNight: 15000, available: true, rating: 4.5 }],
        totalEstimatedCost: 150000,
      };
      mockCreate.mockResolvedValueOnce({ content: [{ type: 'text', text: JSON.stringify(mockPlan) }] });
      const plan = await planner.generateTravelPlan({ destination: '교토', checkIn: '2024-04-01', checkOut: '2024-04-03', guests: 2 });
      expect(plan.destination).toBe('교토');
      expect(plan.itinerary).toHaveLength(1);
      expect(plan.id).toBeTruthy();
      expect(plan.createdAt).toBeInstanceOf(Date);
    });

    it('should throw on invalid JSON response', async () => {
      mockCreate.mockResolvedValueOnce({ content: [{ type: 'text', text: 'invalid json here' }] });
      await expect(planner.generateTravelPlan({ destination: '교토', checkIn: '2024-04-01', checkOut: '2024-04-03', guests: 2 })).rejects.toThrow('Failed to parse travel plan JSON');
    });
  });

  describe('extractTravelRequest', () => {
    it('should extract travel info from message', async () => {
      const extracted = { destination: '교토', checkIn: '2024-04-01', checkOut: '2024-04-03', guests: 2, budget: null, preferences: [] };
      mockCreate.mockResolvedValueOnce({ content: [{ type: 'text', text: JSON.stringify(extracted) }] });
      const result = await planner.extractTravelRequest('교토 3박 4일 2명');
      expect(result.destination).toBe('교토');
      expect(result.guests).toBe(2);
    });

    it('should return empty object on parse failure', async () => {
      mockCreate.mockResolvedValueOnce({ content: [{ type: 'text', text: 'not json' }] });
      const result = await planner.extractTravelRequest('vague message');
      expect(result).toEqual({});
    });
  });
});
