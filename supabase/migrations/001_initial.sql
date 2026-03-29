create table if not exists chat_sessions (
  id text primary key,
  messages jsonb not null default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists monitor_jobs (
  id text primary key,
  hotel_url text not null,
  site text not null,
  check_in text not null,
  check_out text not null,
  guests integer not null default 2,
  telegram_chat_id text not null,
  status text not null default 'active',
  created_at timestamptz default now()
);

alter table chat_sessions enable row level security;
alter table monitor_jobs enable row level security;

create policy "anon read chat_sessions" on chat_sessions for all using (true) with check (true);
create policy "anon read monitor_jobs" on monitor_jobs for all using (true) with check (true);
