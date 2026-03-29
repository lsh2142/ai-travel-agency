#!/bin/bash
set -e
cd "$(dirname "$0")"

# Load env from parent directory
set -a
source ../.env.local 2>/dev/null || true
set +a

# Use pip3 / python3
PIP=$(which pip3 || which pip || echo "")
PYTHON=$(which python3 || which python || echo "")

if [ -z "$PYTHON" ]; then
  echo "❌ Python이 설치되어 있지 않습니다."
  exit 1
fi

if [ -z "$PIP" ]; then
  echo "pip3를 찾지 못했습니다. python -m pip으로 시도합니다."
  PIP="$PYTHON -m pip"
fi

echo "📦 의존성 설치 중..."
$PIP install -r requirements.txt --quiet --break-system-packages 2>/dev/null || $PIP install -r requirements.txt --quiet

echo "🚀 Streamlit 전광판 시작..."
$PYTHON -m streamlit run app.py --server.port 8501 --server.headless true
