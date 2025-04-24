#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting Prisma Studio with clean environment...${NC}"

# Kill existing Prisma Studio instances
echo -e "${YELLOW}Killing existing Prisma Studio...${NC}"
pkill -f "prisma studio" || echo "No Prisma Studio running"
kill -9 $(lsof -ti:5555) 2>/dev/null || echo "Port 5555 already free"
sleep 1

# Fix node path (in case there's a path issue)
export PATH="$PATH:$(npm bin -g)"

# Clear Prisma caches
echo -e "${YELLOW}Clearing Prisma caches...${NC}"
rm -rf node_modules/.prisma

# Regenerate Prisma client first
echo -e "${YELLOW}Regenerating Prisma client...${NC}"
NODE_ENV=production npx prisma generate --schema=prisma/schema.prisma

# Start Prisma Studio
echo -e "${GREEN}Starting Prisma Studio on port 5555...${NC}"
echo -e "${YELLOW}Database UI will be available at: ${GREEN}http://localhost:5555${NC}"
NODE_ENV=production npx prisma studio 