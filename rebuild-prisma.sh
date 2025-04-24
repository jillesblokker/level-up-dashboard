#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Complete Prisma rebuild in progress...${NC}"

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

# Fix port 3004 issue in GitHub callback URL in auth.ts
echo -e "${YELLOW}Fixing auth configuration...${NC}"
sed -i '' 's/http:\/\/localhost:3004\/api\/auth\/callback\/github/http:\/\/localhost:3005\/api\/auth\/callback\/github/g' auth.ts

# Fix permissions on node_modules
echo -e "${YELLOW}Fixing permissions...${NC}"
chmod -R 755 node_modules/@prisma node_modules/prisma 2>/dev/null

# Fix package.json scripts to always use port 3005
echo -e "${YELLOW}Updating package.json...${NC}"
sed -i '' 's/"dev": "next dev"/"dev": "next dev -p 3005"/g' package.json

# Regenerate the Prisma client completely
echo -e "${YELLOW}Completely regenerating Prisma client...${NC}"
npx prisma generate --schema=prisma/schema.prisma

# Test the Prisma connection
echo -e "${YELLOW}Testing database connection...${NC}"
npx prisma db pull --schema=prisma/schema.prisma || echo "Database schema pull not needed"

echo -e "${GREEN}Complete rebuild done! Starting services...${NC}"
echo -e "${GREEN}Starting Next.js and Prisma Studio...${NC}"
./start-all.sh 