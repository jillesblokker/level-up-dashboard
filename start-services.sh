#!/bin/bash

echo "Starting services..."

# Function to check if a port is in use
check_port() {
    lsof -i :$1 >/dev/null 2>&1
    return $?
}

# Function to wait for a port to be ready
wait_for_port() {
    local port=$1
    local service=$2
    local timeout=30
    local count=0
    
    echo "Waiting for $service to be ready on port $port..."
    while ! curl -s http://localhost:$port >/dev/null; do
        sleep 1
        count=$((count + 1))
        if [ $count -ge $timeout ]; then
            echo "$service failed to start within $timeout seconds"
            return 1
        fi
    done
    echo "$service is ready on port $port"
    return 0
}

# Kill any existing processes
echo "Cleaning up existing processes..."
pkill -f "next"
pkill -f "prisma"
sleep 2

# Start Prisma Studio
echo "Starting Prisma Studio..."
npx prisma studio &
PRISMA_PID=$!

# Start Next.js
echo "Starting Next.js..."
npm run dev &
NEXT_PID=$!

# Wait for services to be ready
sleep 5

# Check if processes are running
if ! ps -p $PRISMA_PID > /dev/null; then
    echo "Prisma Studio failed to start"
    exit 1
fi

if ! ps -p $NEXT_PID > /dev/null; then
    echo "Next.js failed to start"
    exit 1
fi

echo "Services started successfully!"
echo "- Prisma Studio: http://localhost:5555"
echo "- Next.js: http://localhost:3005"
echo ""
echo "Press Ctrl+C to stop all services"

# Keep script running and handle cleanup on exit
trap "kill $PRISMA_PID $NEXT_PID; exit" INT TERM
wait 