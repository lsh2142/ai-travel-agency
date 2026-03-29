import streamlit as st
import os
from datetime import datetime

try:
    from supabase import create_client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False


st.set_page_config(
    page_title="AI Travel Agent — 개발 전광판",
    page_icon="✈️",
    layout="wide",
    initial_sidebar_state="collapsed"
)

st.markdown("""
<style>
.agent-card { padding:16px; border-radius:12px; margin-bottom:8px; border:1px solid rgba(255,255,255,0.1); }
.status-idle { background:rgba(100,100,100,0.2); border-left:4px solid #666; }
.status-working { background:rgba(59,130,246,0.2); border-left:4px solid #3b82f6; }
.status-reviewing { background:rgba(251,191,36,0.2); border-left:4px solid #fbbf24; }
.status-offline { background:rgba(239,68,68,0.1); border-left:4px solid #ef4444; }
.task-card { background:rgba(255,255,255,0.08); border-radius:8px; padding:10px; margin-bottom:8px; font-size:13px; }
.priority-high { border-left:3px solid #ef4444; }
.priority-medium { border-left:3px solid #f59e0b; }
.priority-low { border-left:3px solid #10b981; }
.priority-critical { border-left:3px solid #8b5cf6; }
</style>
""", unsafe_allow_html=True)

@st.cache_resource
def get_supabase():
    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL") or os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    if url and key and SUPABASE_AVAILABLE:
        try:
            return create_client(url, key)
        except Exception:
            return None
    return None

MOCK_AGENTS = [
    {"agent_id": "local_4ceb4a29", "agent_name": "CEO 에이전트", "role": "프로젝트 방향 감독", "status": "idle", "current_task": None},
    {"agent_id": "local_62640cda", "agent_name": "디자이너 에이전트", "role": "UI/UX 전담", "status": "idle", "current_task": None},
    {"agent_id": "local_abf1d986", "agent_name": "검증 에이전트", "role": "타입체크/테스트/빌드", "status": "idle", "current_task": None},
    {"agent_id": "local_32e8d9bb", "agent_name": "형상관리 에이전트", "role": "브랜치 머지/Push", "status": "idle", "current_task": None},
    {"agent_id": "pm_agent", "agent_name": "PM 에이전트", "role": "작업 배분/관리", "status": "working", "current_task": "에이전트 정리 및 전광판 구축"},
]

MOCK_KANBAN = {
    "backlog": [
        {"title": "SerpAPI Key 연결", "priority": "high", "assigned_to": None},
        {"title": "Vercel 배포", "priority": "high", "assigned_to": None},
        {"title": "Redis Cloud 설정", "priority": "medium", "assigned_to": None},
        {"title": "/api/flights 딥링크 연결", "priority": "medium", "assigned_to": None},
    ],
    "analyzing": [],
    "designing": [],
    "developing": [
        {"title": "전광판 구현", "priority": "high", "assigned_to": "PM 에이전트"},
    ],
    "verifying": [],
    "done": [
        {"title": "항공권 Provider 패턴 (SerpAPI)", "priority": "high", "assigned_to": None},
        {"title": "딥링크 엔진 구현", "priority": "medium", "assigned_to": None},
        {"title": "일정 관리 대시보드", "priority": "medium", "assigned_to": None},
        {"title": "마크다운 렌더링 수정", "priority": "high", "assigned_to": None},
        {"title": "탭 채팅 리셋 수정 (SPA)", "priority": "high", "assigned_to": None},
    ],
}

MOCK_LOGS = [
    {"created_at": datetime.now().strftime("%Y-%m-%d %H:%M"), "event_type": "task_assigned", "agent_name": "PM 에이전트", "message": "전광판 구현 작업 시작"},
    {"created_at": datetime.now().strftime("%Y-%m-%d %H:%M"), "event_type": "agent_status_change", "agent_name": "검증 에이전트", "message": "idle 상태로 대기 중"},
    {"created_at": datetime.now().strftime("%Y-%m-%d %H:%M"), "event_type": "merge_request", "agent_name": "형상관리 에이전트", "message": "main 브랜치 최신 상태 확인 완료"},
]

def get_agents(sb):
    if sb:
        try:
            return sb.table("agent_statuses").select("*").order("created_at").execute().data
        except Exception:
            pass
    return MOCK_AGENTS

def get_kanban(sb):
    if sb:
        try:
            tasks = sb.table("kanban_tasks").select("*").order("created_at").execute().data
            grouped = {k: [] for k in ["backlog","analyzing","designing","developing","verifying","done"]}
            for t in tasks:
                col = t.get("status","backlog")
                if col in grouped:
                    grouped[col].append(t)
            return grouped
        except Exception:
            pass
    return MOCK_KANBAN

def get_logs(sb, limit=20):
    if sb:
        try:
            return sb.table("dispatch_logs").select("*").order("created_at", desc=True).limit(limit).execute().data
        except Exception:
            pass
    return MOCK_LOGS

def status_badge(s):
    return {"idle":"⚪ 대기","working":"🔵 작업중","reviewing":"🟡 검토중","offline":"🔴 오프라인"}.get(s, s)

def priority_icon(p):
    return {"high":"🔴","medium":"🟡","low":"🟢","critical":"⚡"}.get(p,"⚪")

EVENT_ICONS = {"task_assigned":"📌","agent_status_change":"🔄","merge_request":"🔀","verification_complete":"✅","error":"❌"}

# ─── Header ───
st.markdown("# ✈️ AI Travel Agent — 개발 전광판")
st.caption(f"마지막 업데이트: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

# 자동 갱신 설정
with st.sidebar:
    st.markdown("### ⚙️ 설정")
    refresh_interval = st.slider("자동 갱신 주기 (초)", 5, 60, 10)
    st.caption(f"매 {refresh_interval}초마다 자동 갱신")
    # HTML meta refresh (외부 패키지 불필요)
    st.markdown(
        f'<meta http-equiv="refresh" content="{refresh_interval}">',
        unsafe_allow_html=True
    )
    if st.button("🔄 지금 새로고침"):
        st.rerun()

sb = get_supabase()
if not sb:
    st.warning("⚠️ Supabase 미연결 — 목업 데이터 표시 중 (환경변수: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)")

st.divider()

# ─── 에이전트 상태 ───
st.markdown("## 🤖 에이전트 상태")
agents = get_agents(sb)
cols = st.columns(max(len(agents), 1))
for i, ag in enumerate(agents):
    with cols[i]:
        s = ag.get("status", "idle")
        task_html = f"<small>📋 {ag.get('current_task')}</small><br>" if ag.get("current_task") else ""
        st.markdown(f"""<div class="agent-card status-{s}">
<b>{ag['agent_name']}</b><br>
<small style="color:#aaa">{ag.get('role','')}</small><br><br>
{status_badge(s)}<br>{task_html}
</div>""", unsafe_allow_html=True)

st.divider()

# ─── 칸반 보드 ───
st.markdown("## 📋 칸반 보드")
kanban = get_kanban(sb)
col_labels = [("backlog","📦 백로그"),("analyzing","🔍 분석중"),("designing","🎨 디자인중"),
              ("developing","⚙️ 개발중"),("verifying","✅ 검증중"),("done","🚀 완료")]
kcols = st.columns(6)
for i, (key, label) in enumerate(col_labels):
    tasks = kanban.get(key, [])
    with kcols[i]:
        st.markdown(f"**{label}** `{len(tasks)}`")
        for t in tasks:
            p = t.get("priority","medium")
            assigned = f"<br><small>👤 {t.get('assigned_to')}</small>" if t.get("assigned_to") else ""
            st.markdown(f"""<div class="task-card priority-{p}">
{priority_icon(p)} {t.get('title','')}{assigned}
</div>""", unsafe_allow_html=True)

st.divider()

# ─── 디스패치 로그 ───
st.markdown("## 📡 디스패치 로그")
for log in get_logs(sb):
    ts = str(log.get("created_at",""))[:16].replace("T"," ")
    icon = EVENT_ICONS.get(log.get("event_type",""), "📋")
    st.markdown(f"`{ts}` {icon} **{log.get('agent_name','System')}** — {log.get('message','')}")

if st.button("🔄 새로고침"):
    st.cache_resource.clear()
    st.rerun()

st.markdown("---")
st.caption("Supabase Realtime 연동 시 자동 업데이트됩니다.")
