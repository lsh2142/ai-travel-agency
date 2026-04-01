#!/bin/bash
cd /Users/claw/ai-travel-agent

echo "=== 현재 worktree 목록 ==="
git worktree list

echo ""
echo "=== worktree 제거 시작 ==="
NAMES=(affectionate-leakey angry-driscoll beautiful-carson elegant-dijkstra focused-zhukovsky loving-perlman tender-hermann tender-kepler vigilant-colden)
for name in "${NAMES[@]}"; do
  path="/Users/claw/ai-travel-agent/.claude/worktrees/$name"
  result=$(git worktree remove --force "$path" 2>&1)
  if [ $? -eq 0 ]; then
    echo "✅ removed: $name"
  else
    echo "⚠️  $name: $result"
    # 폴백: .git/worktrees/<name> 메타데이터 직접 삭제
    rm -rf ".git/worktrees/$name" 2>/dev/null && echo "  → 메타데이터 직접 삭제 완료"
  fi
done

echo ""
echo "=== worktree prune ==="
git worktree prune -v

echo ""
echo "=== claude/* 브랜치 정리 ==="
git branch | grep "claude/" | while read branch; do
  git branch -D "$branch" 2>&1 && echo "✅ deleted branch: $branch" || echo "⚠️  branch: $branch"
done

echo ""
echo "=== 최종 worktree 목록 ==="
git worktree list

echo ""
echo "=== 남은 로컬 브랜치 ==="
git branch
