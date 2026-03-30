#!/bin/bash
# ============================================================
# PM 에이전트 생성 — 일회성 에이전트 Worktree 정리 스크립트
# 생성일: 2026-03-30
# 대상: 완료된 500 에러 대응 + UX 검증 일회성 세션 10개
# ============================================================

set -e
cd /Users/claw/ai-travel-agent

echo "========================================"
echo " AI Travel Agent — Worktree 정리 시작"
echo "========================================"
echo ""

# 정리 대상 목록 (세션 설명 포함)
declare -A TARGETS=(
  ["busy-murdock"]="local_e1fdffc0 — 빠른 500 원인 파악 (파일 읽기만)"
  ["compassionate-colden"]="local_ec041759 — 서버 500 에러 진단 및 수정"
  ["dreamy-borg"]="local_e4f2522b — UX 검증 curl 기반 즉시 실행"
  ["great-hugle"]="local_db1f8e27 — 500 에러 빠른 수정 (서버 재시작)"
  ["hungry-ellis"]="local_a37ca147 — UX 검증 에이전트 (권한우회 headless 모드)"
  ["suspicious-jones"]="local_68b7e04f — 앱 에러 원인 파악 (소스 직접 분석)"
  ["cool-mcclintock"]="local_a6681e1a — UX 검증 Playwright 자동 테스트"
  ["condescending-jackson"]="local_4d38b6dc — 500 에러 실제 로그 확인 및 수정"
  ["bold-solomon"]="local_3e3e914f — UX 검증 권한우회 최종 실행"
  ["nostalgic-gagarin"]="local_ed58c086 — UX 소스코드 분석 즉시 실행"
)

# 보호 대상 확인 (절대 삭제 금지)
PROTECTED=("디자이너:local_62640cda" "형상관리:local_32e8d9bb" "검증:local_abf1d986" "개발서버:local_92fbc668" "CEO:local_4ceb4a29")

echo "⚠️  보호 대상 에이전트 (삭제 대상 아님):"
for p in "${PROTECTED[@]}"; do
  echo "   ✋ $p"
done
echo ""

SUCCESS=0
SKIP=0
FAIL=0

for name in "${!TARGETS[@]}"; do
  desc="${TARGETS[$name]}"
  wt_path="/Users/claw/ai-travel-agent/.claude/worktrees/$name"

  printf "%-25s" "[$name]"

  if [ ! -d "$wt_path" ]; then
    echo "⏭️  이미 없음 (스킵)"
    ((SKIP++))
    continue
  fi

  # git worktree remove 시도
  if git worktree remove --force "$wt_path" 2>/dev/null; then
    echo "✅ 삭제 완료  ($desc)"
    ((SUCCESS++))
  else
    # fallback: rm -rf
    if rm -rf "$wt_path" 2>/dev/null; then
      echo "✅ rm -rf 완료 ($desc)"
      ((SUCCESS++))
    else
      echo "❌ 삭제 실패  ($desc)"
      ((FAIL++))
    fi
  fi
done

echo ""
echo "========================================"
echo " 정리 완료: 성공 $SUCCESS / 스킵 $SKIP / 실패 $FAIL"
echo "========================================"
echo ""

# git worktree prune으로 메타데이터 정리
echo "🔧 git worktree prune 실행 중..."
git worktree prune -v 2>&1 | sed 's/^/   /'

echo ""
echo "📋 남은 worktree 목록:"
git worktree list | grep -v "^\[main\]"

echo ""
echo "✅ 정리 완료"
