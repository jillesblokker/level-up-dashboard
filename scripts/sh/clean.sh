#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Cleaning up Next.js application...${NC}"

# Kill any running Next.js processes
echo -e "${YELLOW}Stopping any running Next.js processes...${NC}"
pkill -f "next" || echo "No Next.js processes running"
pkill -f "node.*server" || echo "No Node servers running"

# Check if any process is using port 3005
PORT_PID=$(lsof -ti:3005)
if [ ! -z "$PORT_PID" ]; then
  echo -e "${YELLOW}Process $PORT_PID is using port 3005, killing...${NC}"
  kill -9 $PORT_PID
fi

# Clean up temporary files and caches
echo -e "${YELLOW}Removing temporary Next.js files...${NC}"
rm -rf .next
rm -rf node_modules/.cache

# Clean environment
echo -e "${YELLOW}Reloading environment...${NC}"
source .env.local 2>/dev/null || echo "No .env.local file found"
source .env 2>/dev/null || echo "No .env file found"

echo -e "${GREEN}Cleanup complete! Starting fresh Next.js server on port 3005...${NC}"
npm run dev
