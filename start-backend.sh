#!/bin/bash
# FlowMind Backend Startup Script
echo "🚀 Starting FlowMind Backend..."
cd /Volumes/D_Drive/FlowMind/backend

# Check if venv exists
if [ ! -d "venv" ]; then
  echo "Creating virtual environment..."
  python3 -m venv venv
  source venv/bin/activate
  pip install -r requirements.txt
else
  source venv/bin/activate
fi

# Check .env exists
if [ ! -f ".env" ]; then
  echo "⚠️  .env file not found. Copying from .env.example..."
  cp .env.example .env
  echo "📝 Please fill in your credentials in backend/.env before proceeding."
  exit 1
fi

echo "✅ Backend starting on http://localhost:8000"
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
