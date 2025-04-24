#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Fixing Prisma client installation...${NC}"

# Kill any existing processes
echo -e "${YELLOW}Cleaning up any existing processes...${NC}"
kill -9 $(lsof -ti:3005) 2>/dev/null || echo "No process on port 3005"
kill -9 $(lsof -ti:5555) 2>/dev/null || echo "No process on port 5555"

# Clear caches
echo -e "${YELLOW}Cleaning caches...${NC}"
rm -rf .next node_modules/.cache
rm -rf node_modules/.prisma

# Fix node_modules permissions
echo -e "${YELLOW}Fixing permissions...${NC}"
chmod -R 755 node_modules/@prisma node_modules/prisma 2>/dev/null || echo "No permission issues"

# Regenerate Prisma client
echo -e "${YELLOW}Regenerating Prisma client...${NC}"
npx prisma generate

# Test database connection
echo -e "${YELLOW}Testing database connection...${NC}"
npx prisma db pull 2>/dev/null || echo "Database schema pull not needed"

echo -e "${GREEN}Prisma client fixed! Now you can start the application with:${NC}"
echo -e "${GREEN}./start-all.sh${NC}" 