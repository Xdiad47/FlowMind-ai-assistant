#!/bin/bash
# FlowMind Backend Startup Script
echo "🚀 Starting FlowMind Backend..."
cd /Volumes/D_Drive/FlowMind

# Check if venv exists
if [ ! -d "backend/venv" ]; then
  echo "Creating virtual environment..."
  python3 -m venv backend/venv
  source backend/venv/bin/activate
  pip install -r backend/requirements.txt
else
  source backend/venv/bin/activate
fi

# Check .env exists
if [ ! -f "backend/.env" ]; then
  echo "⚠️  backend/.env not found. Copying from backend/.env.example..."
  cp backend/.env.example backend/.env
  echo "📝 Please fill in your credentials in backend/.env before proceeding."
  exit 1
fi

echo "✅ Backend starting on http://localhost:8000"
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
