#!/bin/bash
# FlowMind Frontend Startup Script
echo "🚀 Starting FlowMind Frontend..."
cd /Volumes/D_Drive/FlowMind

# Check .env.local exists
if [ ! -f ".env.local" ]; then
  echo "⚠️  .env.local not found. Copying from .env.local.example..."
  cp .env.local.example .env.local
  echo "📝 Please fill in your credentials in .env.local before proceeding."
  exit 1
fi

echo "✅ Frontend starting on http://localhost:3000"
npm run dev
