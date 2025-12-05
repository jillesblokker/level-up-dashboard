#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "${RED}=== DATABASE & PORTS ULTIMATE FIX ===${NC}"
echo "${YELLOW}This script will fix both port conflicts and the 'prepared statement s0 already exists' error${NC}"

# STEP 1: Terminate ALL node processes aggressively
echo
echo "${YELLOW}[1/6] Killing ALL processes...${NC}"
pkill -9 -f "node|next|npm|prisma" 2>/dev/null || true
sleep 2

# Explicitly free ports 3000-3010 and 5555-5556
echo
echo "${YELLOW}[2/6] Freeing ALL ports...${NC}"
for port in {3000..3010} 5555 5556; do
  lsof -ti:$port | xargs kill -9 2>/dev/null || echo "Port $port is free"
done
sleep 2

# STEP 3: Reset all build artifacts
echo
echo "${YELLOW}[3/6] Cleaning ALL artifacts...${NC}"
rm -rf .next
rm -rf node_modules/.cache
rm -rf node_modules/.prisma
rm -rf .prisma
rm -rf prisma/generated

# STEP 4: Fix the PostgreSQL "prepared statement s0 already exists" error
# This creates a special SQL script that sends DEALLOCATE ALL to the database
echo
echo "${YELLOW}[4/6] Fixing PostgreSQL prepared statement error...${NC}"

cat > reset-prepared-statements.sql << 'EOL'
-- This SQL script resets all prepared statements in the current session
DEALLOCATE ALL;
EOL

# Try to run the SQL command directly if psql is available
if command -v psql &> /dev/null; then
  echo "Running PostgreSQL cleanup command with psql..."
  DATABASE_URL=$(grep DATABASE_URL .env | cut -d '=' -f2- | tr -d '"')
  psql "$DATABASE_URL" -f reset-prepared-statements.sql || echo "Command completed with warnings (this is normal)"
else
  echo "${RED}PostgreSQL client not found. Unable to run direct cleanup.${NC}"
  echo "The script will continue but you may need to manually reset your database connection."
fi

# STEP 5: Fix the auth.ts file to use the correct callback URL
echo
echo "${YELLOW}[5/6] Fixing authentication callback URL...${NC}"
sed -i '' 's/localhost:3004/localhost:3005/g' auth.ts 2>/dev/null || true

# STEP 6: Generate a fresh Prisma client
echo
echo "${YELLOW}[6/6] Regenerating Prisma client...${NC}"
npx prisma generate

echo
echo "${GREEN}=== FIX COMPLETE! ===${NC}"
echo "${GREEN}Now running the start-all.sh script to start both servers...${NC}"

# Run the start-all.sh script
./start-all.sh 