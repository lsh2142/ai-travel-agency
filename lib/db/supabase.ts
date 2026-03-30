import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set in .env.local');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      travel_plans: {
        Row: {
          id: string;
          user_id: string;
          destination: string;
          check_in: string;
          check_out: string;
          guests: number;
          plan_data: Record<string, unknown>;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['travel_plans']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['travel_plans']['Insert']>;
      };
      monitor_jobs: {
        Row: {
          id: string;
          user_id: string;
          accommodation_id: string;
          url: string;
          site: string;
          check_in: string;
          check_out: string;
          guests: number;
          status: string;
          created_at: string;
          last_checked_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['monitor_jobs']['Row'], 'created_at' | 'last_checked_at'>;
        Update: Partial<Database['public']['Tables']['monitor_jobs']['Insert']>;
      };
    };
  };
};
