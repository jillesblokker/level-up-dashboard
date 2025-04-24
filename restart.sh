#!/bin/bash

echo "Restarting services..."

# Kill existing processes
pkill -f "next"
pkill -f "prisma studio"

# Wait for ports to be freed
sleep 2

# Start Prisma Studio
echo "Starting Prisma Studio..."
npx prisma studio --port 5555 &

# Wait for Prisma to start
sleep 2

# Start Next.js
echo "Starting Next.js..."
npm run dev &

echo "Services restarted!"
echo "- Next.js: http://localhost:3005"
echo "- Prisma Studio: http://localhost:5555" 