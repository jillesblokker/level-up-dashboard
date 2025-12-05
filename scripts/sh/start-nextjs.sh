#!/bin/bash
echo "Starting Next.js without npm..."
cd "$(dirname "$0")"
export PORT=3005
export NODE_ENV=development

# First kill any existing process
lsof -ti:3005 | xargs kill -9 2>/dev/null || echo "Port 3005 is free"

# Start Next.js directly
./node_modules/.bin/next dev -p 3005
