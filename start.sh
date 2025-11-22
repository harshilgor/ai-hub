#!/bin/bash

echo "🚀 Starting AI Hub with Real-Time Research Papers"
echo ""

# Check if backend dependencies are installed
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

# Start backend in background
echo "🔧 Starting backend server..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "⏳ Waiting for backend to initialize (10 seconds)..."
sleep 10

# Start frontend
echo "🎨 Starting frontend..."
npm run dev

# Cleanup on exit
trap "echo '🛑 Stopping servers...'; kill $BACKEND_PID 2>/dev/null" EXIT

