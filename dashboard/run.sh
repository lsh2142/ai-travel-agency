#!/bin/bash
cd "$(dirname "$0")"
set -a
source ../.env.local 2>/dev/null || true
set +a
pip install -r requirements.txt --quiet
streamlit run app.py --server.port 8501 --server.headless true
