#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Fixing database schema mismatches...${NC}"

# Stop all processes
echo -e "${YELLOW}Killing all server processes...${NC}"
pkill -f "prisma|next|node" || echo "No processes to kill"
sleep 1

# Ensure ports are free
echo -e "${YELLOW}Freeing ports...${NC}"
kill -9 $(lsof -ti:3005) 2>/dev/null || echo "Port 3005 is free"
kill -9 $(lsof -ti:5555) 2>/dev/null || echo "Port 5555 is free"
sleep 1

# Clear caches and Prisma artifacts
echo -e "${YELLOW}Clearing all caches and Prisma artifacts...${NC}"
rm -rf .next node_modules/.cache
rm -rf node_modules/.prisma
rm -rf generated
rm -rf prisma/generated

# Regenerate Prisma client
echo -e "${YELLOW}Regenerating Prisma client...${NC}"
NODE_ENV=production npx prisma generate

# Push schema changes to database
echo -e "${RED}IMPORTANT: This will update your database schema to match the Prisma schema.${NC}"
echo -e "${RED}Any schema changes that would result in data loss will be blocked.${NC}"
echo -e "${YELLOW}Pushing Prisma schema to database...${NC}"
NODE_ENV=production npx prisma db push --accept-data-loss

# Verify database connection
echo -e "${YELLOW}Testing database connection...${NC}"
NODE_ENV=production npx prisma db pull

echo -e "${GREEN}Database schema has been synchronized with Prisma schema!${NC}"
echo -e "${YELLOW}Starting services...${NC}"
./start-all.sh 