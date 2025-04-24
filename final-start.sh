#!/bin/bash

echo "Starting final fix..."

# Kill all processes
pkill -f "node|next|npm|prisma" 2>/dev/null || true
sleep 2

# Free ports
lsof -ti:3005,5555 | xargs kill -9 2>/dev/null || echo "Ports already free"
sleep 1

# Remove problematic package from package.json
echo "Removing problematic package..."
sed -i '' '/"@radix-ui\/react-sheet"/d' package.json

# Install only TypeScript dependencies first
echo "Installing TypeScript dependencies..."
npm install --save-dev typescript@5.4.2 @types/react@18.2.64 @types/node@20.11.25

# Install Prisma separately
echo "Installing Prisma..."
npm install --save @prisma/client@5.10.2
npm install --save-dev prisma@5.10.2

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Start Next.js in the background
echo "Starting Next.js..."
npm run dev &
NEXT_PID=$!

# Wait a moment for Next.js to start
sleep 5

# Start Prisma Studio
echo "Starting Prisma Studio..."
NODE_ENV=production npx prisma studio &
PRISMA_PID=$!

echo "Services started:"
echo "- Next.js: http://localhost:3005"
echo "- Prisma Studio: http://localhost:5555"
echo "Press Ctrl+C to stop all services"

# Handle clean exit
trap "kill $NEXT_PID $PRISMA_PID 2>/dev/null" EXIT

# Wait for Next.js to exit
wait $NEXT_PID 