#!/bin/bash

echo "🚀 Starting Airbnb Full-Stack Application"

# Function to handle cleanup
cleanup() {
    echo "🛑 Shutting down services..."
    kill $FRONTEND_PID $BACKEND_PID 2>/dev/null || true
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

echo "📦 Starting Frontend (Vite)..."
# Start the frontend in the background from client directory
(cd client && npm run dev) &
FRONTEND_PID=$!

echo "🔧 Starting Backend (Node.js)..."
# Start the backend in the background from api directory  
(cd api && npm start) &
BACKEND_PID=$!

echo "✅ Both services started!"
echo "Frontend PID: $FRONTEND_PID"
echo "Backend PID: $BACKEND_PID"
echo "Frontend URL: http://localhost:5173"
echo "Backend URL: http://localhost:4000"
echo ""
echo "Press Ctrl+C to stop both services"

# Wait for both processes
wait
