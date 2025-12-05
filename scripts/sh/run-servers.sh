#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "Starting Level Up Dashboard servers..."

# Kill processes directly
for port in 3005 5555; do
  process=$(lsof -ti:$port)
  if [ ! -z "$process" ]; then
    echo "Killing process on port $port: $process"
    kill -9 $process
  else
    echo "No process on port $port"
  fi
done
sleep 2

# Start Prisma Studio first, directly using npx
echo "Starting Prisma Studio on port 5555..."
echo "If this fails, try accessing it at http://localhost:5556 instead"
cd "$(dirname "$0")"
export NODE_ENV=production
npx prisma studio &
PRISMA_PID=$!
sleep 3

# Check if Prisma is running
if ! lsof -ti:5555 > /dev/null; then
  echo "Prisma failed on default port, trying port 5556..."
  npx prisma studio --port 5556 &
  PRISMA_PID=$!
  PRISMA_PORT=5556
else
  PRISMA_PORT=5555
fi

# Now start Next.js on port 3005
echo "Starting Next.js on port 3005..."
cd "$(dirname "$0")"
export PORT=3005
npm run dev &
NEXT_PID=$!

echo "Services started:"
echo "- Next.js: http://localhost:3005"
echo "- Prisma Studio: http://localhost:$PRISMA_PORT"
echo "Press Ctrl+C to stop all services"

# Handle clean exit
trap "kill $NEXT_PID $PRISMA_PID 2>/dev/null" EXIT

# Keep the script running until Next.js exits
wait $NEXT_PID 