-- Travel chat sessions
CREATE TABLE IF NOT EXISTS chat_sessions (
  session_id TEXT PRIMARY KEY,
  messages   JSONB        NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Vacancy monitoring jobs
CREATE TABLE IF NOT EXISTS monitor_jobs (
  id                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  accommodation_id   TEXT         NOT NULL,
  url                TEXT         NOT NULL,
  site               TEXT         NOT NULL,
  check_in           DATE         NOT NULL,
  check_out          DATE         NOT NULL,
  guests             INT          NOT NULL,
  accommodation_name TEXT         NOT NULL DEFAULT '',
  user_id            TEXT         NOT NULL DEFAULT '',
  status             TEXT         NOT NULL DEFAULT 'active',
  created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  last_checked_at    TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_monitor_jobs_status ON monitor_jobs (status);
CREATE INDEX IF NOT EXISTS idx_monitor_jobs_created_at ON monitor_jobs (created_at DESC);
