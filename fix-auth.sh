#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Fixing GitHub OAuth callback URLs...${NC}"

# Fix hardcoded port 3004 in auth.ts (this is the source of authentication failures)
echo -e "${YELLOW}Updating auth.ts to use port 3005 consistently...${NC}"
sed -i '' 's/http:\/\/localhost:3004\/api\/auth\/callback\/github/http:\/\/localhost:3005\/api\/auth\/callback\/github/g' auth.ts
grep -n "localhost:3004" auth.ts && echo -e "${RED}Found port 3004 in auth.ts (needs fixing)${NC}" || echo -e "${GREEN}auth.ts is using correct port 3005${NC}"

# Update the .env file to ensure consistent port usage
echo -e "${YELLOW}Updating .env file...${NC}"
grep -n "NEXTAUTH_URL" .env && echo -e "${GREEN}NEXTAUTH_URL exists in .env${NC}" || echo -e "NEXTAUTH_URL=http://localhost:3005" >> .env

# Fix URL in signin page
echo -e "${YELLOW}Updating signin page...${NC}"
sed -i '' 's/NEXTAUTH_URL = "http:\/\/localhost:3004"/NEXTAUTH_URL = "http:\/\/localhost:3005"/g' app/auth/signin/page.tsx

echo -e "${GREEN}GitHub OAuth URL fixes complete!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Run ${GREEN}./rebuild-prisma.sh${NC} for a complete rebuild"
echo -e "2. Or run ${GREEN}./start-all.sh${NC} to start the application" 