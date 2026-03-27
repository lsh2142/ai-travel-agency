import type { TelegramNotification, NotificationResult } from '@/types';

export class TelegramNotifier {
  private botToken: string;
  private defaultChatId: string;
  private baseUrl: string;

  constructor(botToken?: string, chatId?: string) {
    this.botToken = botToken ?? process.env.TELEGRAM_BOT_TOKEN ?? '';
    this.defaultChatId = chatId ?? process.env.TELEGRAM_CHAT_ID ?? '';
    this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
  }

  async sendMessage(notification: TelegramNotification): Promise<NotificationResult> {
    if (!this.botToken) {
      return { success: false, error: 'Telegram bot token not configured' };
    }

    const chatId = notification.chatId || this.defaultChatId;
    if (!chatId) {
      return { success: false, error: 'Telegram chat ID not configured' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: notification.message,
          parse_mode: notification.parseMode ?? 'HTML',
        }),
      });

      const data = await response.json() as { ok: boolean; result?: { message_id: number }; description?: string };

      if (!data.ok) {
        return { success: false, error: data.description ?? 'Telegram API error' };
      }

      return { success: true, messageId: data.result?.message_id };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async notifyAvailability(
    accommodationName: string,
    site: string,
    url: string,
    checkIn: string,
    checkOut: string,
    price?: number,
    chatId?: string
  ): Promise<NotificationResult> {
    const priceText = price ? `\n💰 가격: ¥${price.toLocaleString()}/박` : '';
    const message = `🏨 <b>빈방 발생 알림!</b>

📍 숙소: <b>${accommodationName}</b>
🌐 사이트: ${site}
📅 체크인: ${checkIn}
📅 체크아웃: ${checkOut}${priceText}

🔗 <a href="${url}">지금 예약하기</a>

⏰ 확인 시간: ${new Date().toLocaleString('ko-KR')}`;

    return this.sendMessage({
      chatId: chatId ?? this.defaultChatId,
      message,
      parseMode: 'HTML',
    });
  }

  async notifyError(
    jobId: string,
    error: string,
    chatId?: string
  ): Promise<NotificationResult> {
    const message = `⚠️ <b>모니터링 오류</b>

작업 ID: ${jobId}
오류: ${error}
시간: ${new Date().toLocaleString('ko-KR')}`;

    return this.sendMessage({
      chatId: chatId ?? this.defaultChatId,
      message,
      parseMode: 'HTML',
    });
  }
}
