#!/bin/bash
cd "$(dirname "$0")"

echo "Starting backend..."
cd backend
source .venv/bin/activate
uvicorn app.main:app --port 8001 &
echo $! > ../.backend.pid
cd ..

echo "Starting frontend..."
cd frontend
npm run dev &
echo $! > ../.frontend.pid
cd ..

echo "Backend: http://localhost:8001"
echo "Frontend: http://localhost:20012"
echo "Use ./stop.sh to stop both servers."
