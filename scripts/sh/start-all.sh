#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "Starting all services for Level Up Dashboard..."

# First, be absolutely sure we're killing all processes
echo "Cleaning up any existing processes..."
pkill -f "node|next|npm|prisma" 2>/dev/null || true
sleep 2

# Force free the ports
for port in 3005 5555; do
  lsof -ti:$port | xargs kill -9 2>/dev/null || echo "No process on port $port"
done
sleep 1

# Clean cache
echo "Cleaning cache..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf node_modules/.prisma
rm -rf .prisma
rm -rf prisma/generated

# Ensure correct callback URL
echo "Ensuring correct callback URL..."
sed -i '' 's/localhost:3004/localhost:3005/g' auth.ts 2>/dev/null || true

# Regenerate Prisma client
echo "Regenerating Prisma client..."
npx prisma generate

# Start Next.js on port 3005
echo "Starting Next.js on port 3005..."
echo "Available at: http://localhost:3005"
npm run dev &
NEXT_PID=$!

# Wait for Next.js to start before starting Prisma Studio
sleep 5

# Start Prisma Studio in a separate process with explicit production mode
# This seems to help avoid some environment conflicts
echo "Starting Prisma Studio in production mode..."
echo "Database management at: http://localhost:5555"
echo "Press Ctrl+C to stop all services"
NODE_ENV=production npx prisma studio > prisma-studio.log 2>&1 &
PRISMA_PID=$!

# Clean handler for Ctrl+C
trap "kill $NEXT_PID $PRISMA_PID 2>/dev/null" EXIT

# Wait for Next.js to exit
wait $NEXT_PID 