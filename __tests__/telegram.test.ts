import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TelegramNotifier } from '@/lib/notify/telegram';

global.fetch = vi.fn();

describe('TelegramNotifier', () => {
  let notifier: TelegramNotifier;
  const mockFetch = global.fetch as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    notifier = new TelegramNotifier('test-bot-token', 'test-chat-id');
    vi.clearAllMocks();
  });

  describe('sendMessage', () => {
    it('should send message successfully', async () => {
      mockFetch.mockResolvedValueOnce({ json: () => Promise.resolve({ ok: true, result: { message_id: 123 } }) });
      const result = await notifier.sendMessage({ chatId: 'test-chat-id', message: 'Test message' });
      expect(result.success).toBe(true);
      expect(result.messageId).toBe(123);
    });
    it('should return error when bot token missing', async () => {
      const result = await new TelegramNotifier('', 'chat-id').sendMessage({ chatId: 'x', message: 'test' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('token');
    });
    it('should return error when chat ID missing', async () => {
      const result = await new TelegramNotifier('token', '').sendMessage({ chatId: '', message: 'test' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('chat ID');
    });
    it('should handle API error response', async () => {
      mockFetch.mockResolvedValueOnce({ json: () => Promise.resolve({ ok: false, description: 'Bad Request: chat not found' }) });
      const result = await notifier.sendMessage({ chatId: 'test-chat-id', message: 'test' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Bad Request');
    });
    it('should handle network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      const result = await notifier.sendMessage({ chatId: 'test-chat-id', message: 'test' });
      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('notifyAvailability', () => {
    it('should send formatted availability notification', async () => {
      mockFetch.mockResolvedValueOnce({ json: () => Promise.resolve({ ok: true, result: { message_id: 456 } }) });
      const result = await notifier.notifyAvailability('교토 료칸', 'jalan', 'https://example.com', '2024-04-01', '2024-04-03', 15000);
      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('sendMessage'), expect.objectContaining({ method: 'POST', body: expect.stringContaining('교토 료칸') }));
    });
    it('should include price in message when provided', async () => {
      mockFetch.mockResolvedValueOnce({ json: () => Promise.resolve({ ok: true, result: { message_id: 1 } }) });
      await notifier.notifyAvailability('호텔', 'rakuten', 'https://x.com', '2024-04-01', '2024-04-02', 20000);
      const callBody = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string);
      expect(callBody.text).toContain('20,000');
    });
    it('should work without price', async () => {
      mockFetch.mockResolvedValueOnce({ json: () => Promise.resolve({ ok: true, result: { message_id: 1 } }) });
      expect((await notifier.notifyAvailability('호텔', 'hitou', 'https://x.com', '2024-04-01', '2024-04-02')).success).toBe(true);
    });
  });

  describe('notifyError', () => {
    it('should send error notification', async () => {
      mockFetch.mockResolvedValueOnce({ json: () => Promise.resolve({ ok: true, result: { message_id: 789 } }) });
      const result = await notifier.notifyError('job-123', 'Connection timeout');
      expect(result.success).toBe(true);
      const callBody = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string);
      expect(callBody.text).toContain('job-123');
      expect(callBody.text).toContain('Connection timeout');
    });
  });
});
