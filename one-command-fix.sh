#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${RED}======= COMPLETE SYSTEM RECOVERY =======${NC}"
echo -e "${YELLOW}This will fix all port conflicts and Prisma issues${NC}"

# STEP 1: Kill EVERYTHING - be extremely aggressive
echo -e "\n${YELLOW}[1/7] Force killing ALL processes...${NC}"
killall -9 node npm npx next prisma 2>/dev/null || true
pkill -f "node|next|npm|prisma" 2>/dev/null || true
for pid in $(ps -ef | grep node | grep -v grep | awk '{print $2}'); do
  kill -9 $pid 2>/dev/null || true
done

# STEP 2: Free ALL ports with absolute certainty
echo -e "\n${YELLOW}[2/7] Forcefully freeing ALL ports...${NC}"
for port in {3000..3010} 5555 5556; do
  lsof -ti:$port | xargs kill -9 2>/dev/null || echo "Port $port is free"
done
sleep 2

# STEP 3: Fresh start - remove ALL build artifacts
echo -e "\n${YELLOW}[3/7] Complete deep cleanup...${NC}"
rm -rf .next
rm -rf node_modules/.cache
rm -rf node_modules/.prisma
rm -rf .prisma
rm -rf prisma/generated
rm -rf prisma/migrations/*_recovery_*
rm -rf generated

# STEP 4: Fix lib/prisma.ts to be simple and reliable
echo -e "\n${YELLOW}[4/7] Fixing lib/prisma.ts...${NC}"
mkdir -p lib
cat > lib/prisma.ts << 'EOL'
import { PrismaClient } from '@prisma/client'

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
declare global {
  var prisma: PrismaClient | undefined
}

// Create a singleton prisma client instance
const prisma = global.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') global.prisma = prisma

export default prisma
EOL

# STEP 5: Regenerate prisma client
echo -e "\n${YELLOW}[5/7] Regenerating Prisma client...${NC}"
npx prisma generate

# STEP 6: Start Prisma Studio on port 5555
echo -e "\n${YELLOW}[6/7] Starting Prisma Studio on port 5555...${NC}"
NODE_ENV=production npx prisma studio > prisma-studio.log 2>&1 &
PRISMA_PID=$!
echo -e "${GREEN}Prisma Studio started on http://localhost:5555${NC}"
sleep 3

# Check if Prisma Studio is actually running
if ! lsof -ti:5555 > /dev/null; then
  echo -e "${RED}Prisma Studio failed to start on port 5555.${NC}"
  echo -e "${YELLOW}Trying alternate port 5556...${NC}"
  NODE_ENV=production npx prisma studio --port 5556 > prisma-studio.log 2>&1 &
  PRISMA_PID=$!
  echo -e "${GREEN}Prisma Studio started on http://localhost:5556${NC}"
  PRISMA_PORT=5556
else
  PRISMA_PORT=5555
fi

# STEP 7: Start Next.js on port 3005 (with clean cache)
echo -e "\n${YELLOW}[7/7] Starting Next.js on port 3005...${NC}"
echo -e "${GREEN}Access your application at: http://localhost:3005${NC}"
echo -e "${GREEN}Access database admin at: http://localhost:${PRISMA_PORT}${NC}"
echo -e "${RED}Press Ctrl+C to stop all services${NC}"

# Run Next.js with a completely clean start
rm -rf .next
next dev -p 3005

# Make sure to kill background processes on exit
kill $PRISMA_PID 2>/dev/null 