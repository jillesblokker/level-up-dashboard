#!/bin/bash
# ============================================================
# deploy.sh — Level Up Dashboard / Ubuntu VPS Deploy Script
# Run this on the Ubuntu server to pull latest code and rebuild
# Usage: bash scripts/sh/deploy.sh
# ============================================================

set -e  # Exit immediately if a command fails

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}==> Level Up Dashboard - Deploying...${NC}"

# 1. Pull latest code from main
echo -e "${YELLOW}[1/5] Pulling latest code from main...${NC}"
git fetch origin
git checkout main
git pull origin main
echo -e "${GREEN}    Done.${NC}"

# 2. Install dependencies (pnpm, matching vercel.json)
echo -e "${YELLOW}[2/5] Installing dependencies...${NC}"
pnpm install --frozen-lockfile
echo -e "${GREEN}    Done.${NC}"

# 3. Build production bundle
echo -e "${YELLOW}[3/5] Building Next.js production bundle...${NC}"
pnpm run build
echo -e "${GREEN}    Done.${NC}"

# 4. Restart the server
echo -e "${YELLOW}[4/5] Restarting server...${NC}"

if command -v pm2 &> /dev/null; then
    # If PM2 is available, use it
    pm2 restart level-up 2>/dev/null || pm2 start server.js --name level-up -- --port 3005
    echo -e "${GREEN}    Restarted via PM2.${NC}"
else
    # Fallback: kill existing process and start fresh
    pkill -f "next start" 2>/dev/null || true
    pkill -f "server.js" 2>/dev/null || true
    sleep 2
    NODE_ENV=production nohup node server.js > /tmp/level-up.log 2>&1 &
    echo -e "${GREEN}    Started in background (PID: $!). Logs: /tmp/level-up.log${NC}"
fi

# 5. Done
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Deploy complete! Site is live on :3005   ${NC}"
echo -e "${GREEN}============================================${NC}"
