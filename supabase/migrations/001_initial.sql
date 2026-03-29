-- Chat Sessions
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id TEXT PRIMARY KEY,
  messages JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Travel Plans
CREATE TABLE IF NOT EXISTS public.travel_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  destination TEXT NOT NULL,
  check_in TEXT NOT NULL,
  check_out TEXT NOT NULL,
  guests INTEGER NOT NULL DEFAULT 1,
  plan_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Monitor Jobs
CREATE TABLE IF NOT EXISTS public.monitor_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  accommodation_id TEXT NOT NULL,
  url TEXT NOT NULL,
  site TEXT NOT NULL,
  check_in TEXT NOT NULL,
  check_out TEXT NOT NULL,
  guests INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_checked_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS travel_plans_user_id_idx ON public.travel_plans(user_id);
CREATE INDEX IF NOT EXISTS monitor_jobs_user_id_idx ON public.monitor_jobs(user_id);
CREATE INDEX IF NOT EXISTS monitor_jobs_status_idx ON public.monitor_jobs(status);

-- Enable Row Level Security
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitor_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies (anon can read/write for now — tighten when auth is added)
CREATE POLICY "anon_all_chat_sessions" ON public.chat_sessions FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_travel_plans" ON public.travel_plans FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_monitor_jobs" ON public.monitor_jobs FOR ALL TO anon USING (true) WITH CHECK (true);
