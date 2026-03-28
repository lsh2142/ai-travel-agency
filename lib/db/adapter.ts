import { supabase } from './supabase';
import type { ChatMessage } from '@/types';

export class DbAdapter {
  async getChatHistory(sessionId: string): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('chat_history')
      .select('role, content, timestamp')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('[DbAdapter] getChatHistory error:', error.message);
      return [];
    }

    return (data ?? []).map((row) => ({
      role: row.role as ChatMessage['role'],
      content: row.content as string,
      timestamp: new Date(row.timestamp as string),
    }));
  }
}
