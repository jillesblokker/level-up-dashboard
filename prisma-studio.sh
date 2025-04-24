#!/bin/bash

echo "Starting Prisma Studio..."

# Free port first
lsof -ti:5555 | xargs kill -9 2>/dev/null || echo "Port 5555 is free"
sleep 1

# Start Prisma Studio
cd "$(dirname "$0")"
NODE_ENV=production npx prisma studio 