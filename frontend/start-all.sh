#!/bin/bash
echo "🚀 Starting FlowMind (Frontend + Backend)..."
chmod +x start-backend.sh start-frontend.sh

# Start backend in background
./start-backend.sh &
BACKEND_PID=$!

# Start frontend
./start-frontend.sh &
FRONTEND_PID=$!

echo ""
echo "✅ FlowMind is running!"
echo "   Frontend → http://localhost:3000"
echo "   Backend  → http://localhost:8000"
echo "   API Docs → http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers."

# Wait and handle Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
