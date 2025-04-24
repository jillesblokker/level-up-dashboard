#!/bin/bash
echo "Starting Prisma Studio without npm..."
cd "$(dirname "$0")"
export NODE_ENV=production

# First kill any existing process
lsof -ti:5555 | xargs kill -9 2>/dev/null || echo "Port 5555 is free" 

# Start Prisma Studio directly
./node_modules/.bin/prisma studio
