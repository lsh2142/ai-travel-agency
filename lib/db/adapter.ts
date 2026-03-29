import { supabase } from './supabase';
import type { MonitorJob } from '@/types';

const isSupabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const db = {
  monitorJobs: {
    async create(job: Omit<MonitorJob, 'createdAt' | 'lastCheckedAt'>): Promise<MonitorJob | null> {
      if (!isSupabaseConfigured) return null;
      const { data, error } = await supabase
        .from('monitor_jobs')
        .insert({
          id: job.id,
          user_id: job.userId,
          accommodation_id: job.accommodationId,
          url: job.url,
          site: job.site,
          check_in: job.checkIn,
          check_out: job.checkOut,
          guests: job.guests,
          status: job.status,
        })
        .select()
        .single();
      if (error) { console.error('[db] monitor_jobs insert:', error.message); return null; }
      return rowToMonitorJob(data);
    },

    async list(userId?: string): Promise<MonitorJob[]> {
      if (!isSupabaseConfigured) return [];
      let query = supabase.from('monitor_jobs').select('*').order('created_at', { ascending: false });
      if (userId) query = query.eq('user_id', userId);
      const { data, error } = await query;
      if (error) { console.error('[db] monitor_jobs select:', error.message); return []; }
      return (data ?? []).map(rowToMonitorJob);
    },

    async updateStatus(id: string, status: MonitorJob['status']): Promise<void> {
      if (!isSupabaseConfigured) return;
      const { error } = await supabase
        .from('monitor_jobs')
        .update({ status, last_checked_at: new Date().toISOString() })
        .eq('id', id);
      if (error) console.error('[db] monitor_jobs update:', error.message);
    },

    async delete(id: string): Promise<void> {
      if (!isSupabaseConfigured) return;
      const { error } = await supabase.from('monitor_jobs').delete().eq('id', id);
      if (error) console.error('[db] monitor_jobs delete:', error.message);
    },
  },
};

function rowToMonitorJob(row: Record<string, unknown>): MonitorJob {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    accommodationId: row.accommodation_id as string,
    url: row.url as string,
    site: row.site as MonitorJob['site'],
    checkIn: row.check_in as string,
    checkOut: row.check_out as string,
    guests: row.guests as number,
    status: row.status as MonitorJob['status'],
    createdAt: new Date(row.created_at as string),
    lastCheckedAt: row.last_checked_at ? new Date(row.last_checked_at as string) : undefined,
  };
}
