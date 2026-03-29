import type { ChatMessage } from '@/types';
import { memoryStore, type MonitorJobRecord } from './store';

export interface DbAdapter {
  saveChatSession(sessionId: string, messages: ChatMessage[]): Promise<void>;
  getChatSession(sessionId: string): Promise<ChatMessage[] | null>;
  saveMonitorJob(job: MonitorJobRecord): Promise<void>;
  getMonitorJobs(): Promise<MonitorJobRecord[]>;
  getMonitorJob(jobId: string): Promise<MonitorJobRecord | null>;
  deleteMonitorJob(jobId: string): Promise<boolean>;
}

function createSupabaseAdapter(): DbAdapter {
  // Lazy import to avoid issues when Supabase env vars are not set
  const { supabase } = require('./supabase') as { supabase: import('@supabase/supabase-js').SupabaseClient };

  return {
    async saveChatSession(sessionId, messages) {
      await supabase
        .from('chat_sessions')
        .upsert({ session_id: sessionId, messages, updated_at: new Date().toISOString() }, { onConflict: 'session_id' });
    },

    async getChatSession(sessionId) {
      const { data } = await supabase
        .from('chat_sessions')
        .select('messages')
        .eq('session_id', sessionId)
        .single();
      return (data?.messages as ChatMessage[]) ?? null;
    },

    async saveMonitorJob(job) {
      await supabase.from('monitor_jobs').upsert({
        id: job.id,
        accommodation_id: job.accommodationId,
        url: job.url,
        site: job.site,
        check_in: job.checkIn,
        check_out: job.checkOut,
        guests: job.guests,
        accommodation_name: job.accommodationName,
        user_id: job.userId,
        status: job.status,
        created_at: job.createdAt.toISOString(),
        last_checked_at: job.lastCheckedAt?.toISOString() ?? null,
      });
    },

    async getMonitorJobs() {
      const { data } = await supabase
        .from('monitor_jobs')
        .select('*')
        .order('created_at', { ascending: false });
      return (data ?? []).map(rowToMonitorJob);
    },

    async getMonitorJob(jobId) {
      const { data } = await supabase
        .from('monitor_jobs')
        .select('*')
        .eq('id', jobId)
        .single();
      return data ? rowToMonitorJob(data) : null;
    },

    async deleteMonitorJob(jobId) {
      const { error } = await supabase.from('monitor_jobs').delete().eq('id', jobId);
      return !error;
    },
  };
}

function rowToMonitorJob(row: Record<string, unknown>): MonitorJobRecord {
  return {
    id: row.id as string,
    accommodationId: row.accommodation_id as string,
    url: row.url as string,
    site: row.site as string,
    checkIn: row.check_in as string,
    checkOut: row.check_out as string,
    guests: row.guests as number,
    accommodationName: (row.accommodation_name as string) ?? '',
    userId: (row.user_id as string) ?? '',
    status: row.status as MonitorJobRecord['status'],
    createdAt: new Date(row.created_at as string),
    lastCheckedAt: row.last_checked_at ? new Date(row.last_checked_at as string) : null,
  };
}

function isSupabaseConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function getDb(): DbAdapter {
  if (isSupabaseConfigured()) {
    return createSupabaseAdapter();
  }
  return memoryStore;
}
