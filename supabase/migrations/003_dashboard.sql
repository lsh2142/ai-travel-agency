-- Agent status tracking
CREATE TABLE IF NOT EXISTS agent_statuses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id text NOT NULL UNIQUE,
  agent_name text NOT NULL,
  role text NOT NULL,
  status text NOT NULL DEFAULT 'idle',
  current_task text,
  last_seen timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Kanban board tasks
CREATE TABLE IF NOT EXISTS kanban_tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'backlog',
  assigned_to text,
  priority text DEFAULT 'medium',
  tags text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Dispatch logs
CREATE TABLE IF NOT EXISTS dispatch_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type text NOT NULL,
  agent_id text,
  agent_name text,
  message text NOT NULL,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Initial data
INSERT INTO agent_statuses (agent_id, agent_name, role, status, current_task) VALUES
  ('local_4ceb4a29', 'CEO 에이전트', '프로젝트 방향 감독 및 에이전트 조율', 'idle', NULL),
  ('local_62640cda', '디자이너 에이전트', 'UI/UX 전담 설계 및 구현', 'idle', NULL),
  ('local_abf1d986', '검증 에이전트', '타입체크, 테스트, API, 빌드 검증', 'idle', NULL),
  ('local_32e8d9bb', '형상관리 에이전트', '브랜치 머지 및 origin push 전담', 'idle', NULL),
  ('pm_agent', 'PM 에이전트', '작업 배분 및 에이전트 관리', 'working', '에이전트 정리 및 전광판 구축')
ON CONFLICT (agent_id) DO NOTHING;

INSERT INTO kanban_tasks (title, description, status, priority) VALUES
  ('SerpAPI Key 연결', 'SERPAPI_KEY를 .env.local에 추가하여 실제 항공권 검색 활성화', 'backlog', 'high'),
  ('Vercel 배포', 'vercel.json 설정 완료, 환경변수 설정 후 배포', 'backlog', 'high'),
  ('Redis Cloud 설정', '프로덕션용 Redis URL 설정', 'backlog', 'medium'),
  ('/api/flights 딥링크 연결', 'lib/booking/links.ts를 /api/flights 응답에 연결', 'backlog', 'medium'),
  ('전광판 구현', 'Streamlit + Supabase 실시간 대시보드', 'developing', 'high'),
  ('항공권 Provider 패턴 (SerpAPI)', 'SerpAPI 기반 항공권 검색 구현 완료', 'done', 'high'),
  ('딥링크 엔진 구현', 'Google/Naver/Kayak/Booking 딥링크 생성기', 'done', 'medium'),
  ('일정 관리 대시보드', '날짜별 타임라인 대시보드', 'done', 'medium'),
  ('마크다운 렌더링 수정', 'react-markdown + remark-gfm 적용', 'done', 'high'),
  ('탭 채팅 리셋 수정 (SPA)', 'hidden CSS 클래스로 SPA 탭 전환', 'done', 'high')
ON CONFLICT DO NOTHING;
