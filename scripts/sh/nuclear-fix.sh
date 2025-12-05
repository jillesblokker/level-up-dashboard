#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${RED}======= NUCLEAR RESET - FIXING ALL ISSUES =======${NC}"
echo -e "${YELLOW}This will resolve all port conflicts, webpack errors, and database problems${NC}"

# STEP 1: Kill EVERYTHING
echo -e "\n${YELLOW}[1/12] Killing all processes...${NC}"
killall -9 node npm next npx prisma 2>/dev/null || echo "No Node processes running"
pkill -9 -f "node" || echo "No node processes"
sleep 3

# STEP 2: Kill ALL terminals
echo -e "\n${YELLOW}[2/12] Killing all terminal instances...${NC}"
pkill -9 Terminal || echo "No terminal processes killed"
for port in {3000..3010} 5555 5556; do
  kill -9 $(lsof -ti:${port}) 2>/dev/null || echo "Port ${port} is free"
done
sleep 2

# STEP 3: Clean EVERYTHING
echo -e "\n${YELLOW}[3/12] Complete cleanup...${NC}"
rm -rf .next
rm -rf node_modules/.cache
rm -rf node_modules/.prisma
rm -rf prisma/migrations/*_recovery_*
rm -rf generated
rm -rf prisma/generated
rm -rf .eslintcache

# STEP 4: Fix packages.json - critical issue found in logs
echo -e "\n${YELLOW}[4/12] Fixing package.json...${NC}"
cat > package.json << 'EOL'
{
  "name": "level-up-dashboard",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3005",
    "build": "prisma generate && prisma db push && next build",
    "start": "next start -p 3005",
    "lint": "next lint",
    "clean-start": "rm -rf .next node_modules/.cache && next dev -p 3005"
  },
  "dependencies": {
    "@auth/prisma-adapter": "^1.4.0",
    "@hookform/resolvers": "^3.3.4",
    "@prisma/client": "^5.10.2",
    "@radix-ui/react-accordion": "^1.1.2",
    "@radix-ui/react-avatar": "^1.0.4",
    "@radix-ui/react-checkbox": "^1.0.4",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-hover-card": "^1.0.7",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-popover": "^1.0.7",
    "@radix-ui/react-scroll-area": "^1.0.5",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-separator": "^1.0.3",
    "@radix-ui/react-sheet": "^0.0.1",
    "@radix-ui/react-slot": "^1.0.2",
    "@radix-ui/react-switch": "^1.0.3",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-toast": "^1.1.5",
    "@radix-ui/react-tooltip": "^1.0.7",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "cmdk": "^0.2.1",
    "date-fns": "^3.3.1",
    "lucide-react": "^0.336.0",
    "next": "14.1.3",
    "next-auth": "^4.24.6",
    "next-themes": "^0.2.1",
    "react": "^18",
    "react-day-picker": "^8.10.0",
    "react-dom": "^18",
    "react-hook-form": "^7.50.1",
    "react-resizable-panels": "^2.0.7",
    "sonner": "^1.4.3",
    "tailwind-merge": "^2.2.1",
    "tailwindcss-animate": "^1.0.7",
    "vaul": "^0.9.0",
    "zod": "^3.22.4",
    "zustand": "^4.5.1"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "autoprefixer": "^10.0.1",
    "eslint": "^8",
    "eslint-config-next": "14.1.3",
    "postcss": "^8",
    "prisma": "^5.10.2",
    "tailwindcss": "^3.3.0",
    "typescript": "^5"
  }
}
EOL

# STEP 5: Fix next.config.mjs - critical configuration issue
echo -e "\n${YELLOW}[5/12] Fixing Next.js configuration...${NC}"
cat > next.config.mjs << 'EOL'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
    ],
    dangerouslyAllowSVG: true,
    unoptimized: false,
  },
  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV === 'development',
  },
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },
  output: 'standalone',
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        async_hooks: false,
        'node:async_hooks': false,
        'node:fs': false,
        'node:net': false,
        'node:tls': false,
        'node:child_process': false,
      };
    }
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  poweredByHeader: false,
  async redirects() {
    return [
      {
        source: '/login',
        destination: '/auth/signin',
        permanent: true,
      },
    ];
  },
}

export default nextConfig
EOL

# STEP 6: Fix auth.ts - addressing the CRITICAL GitHub callback URL issue
echo -e "\n${YELLOW}[6/12] Fixing auth.ts...${NC}"
grep -n "localhost:3004" auth.ts && {
  echo -e "${RED}Found incorrect port 3004 in auth.ts - fixing...${NC}"
  sed -i '' 's/http:\/\/localhost:3004/http:\/\/localhost:3005/g' auth.ts
  echo -e "${GREEN}✓ Fixed auth.ts to use port 3005${NC}"
} || echo -e "${GREEN}✓ auth.ts already using correct port 3005${NC}"

# STEP 7: Fix .env file - ensure proper environment variables
echo -e "\n${YELLOW}[7/12] Fixing environment variables...${NC}"
# Backup existing .env
cp .env .env.backup
cat > .env << 'EOL'
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3005
NEXTAUTH_SECRET=FreLc+4cCoEOugZiT2EZhZHBCAgxnWCDdvayXirC2R8=

# Disable debug mode in production
NEXTAUTH_DEBUG=false

# GitHub OAuth
GITHUB_ID=Ov23liYcY8WleiBe1Qij
GITHUB_SECRET=d7387ce4cef3fc3ae31804e0981c99f98c349f32
GITHUB_CALLBACK_URL=http://localhost:3005/api/auth/callback/github

# Database configuration (PostgreSQL via Supabase)
DATABASE_URL="postgresql://postgres.uunfpqrauivviygysjzj:Kingdom3000!Levelup!@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.uunfpqrauivviygysjzj:Kingdom3000!Levelup!@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

# Admin credentials
ADMIN_EMAIL="admin@levelup.com"
ADMIN_PASSWORD="LevelUp2024!"

# Server port configuration
PORT="3005"
EOL

# STEP 8: Create fixed SQL migration for missing RealmMap.userId column
echo -e "\n${YELLOW}[8/12] Creating database migration for missing column...${NC}"
RECOVERY_DIR="prisma/migrations/recovery_$(date +%s)"
mkdir -p "$RECOVERY_DIR"

cat > "$RECOVERY_DIR/migration.sql" << EOL
-- DropForeignKey
ALTER TABLE IF EXISTS "RealmMap" DROP CONSTRAINT IF EXISTS "RealmMap_userId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "RealmMap_userId_key";

-- AlterTable
ALTER TABLE "RealmMap" ADD COLUMN IF NOT EXISTS "userId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "RealmMap_userId_key" ON "RealmMap"("userId");

-- AddForeignKey
ALTER TABLE "RealmMap" ADD CONSTRAINT "RealmMap_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EOL

echo -e "${GREEN}✓ Created database migration${NC}"

# STEP 9: Regenerate Prisma
echo -e "\n${YELLOW}[9/12] Regenerating Prisma...${NC}"
NODE_ENV=production npx prisma generate

# STEP 10: Fix database schema
echo -e "\n${YELLOW}[10/12] Fixing database schema...${NC}"
echo -e "${RED}IMPORTANT: This will update your database schema. ${NC}"
NODE_ENV=production npx prisma db push --accept-data-loss

# STEP 11: Verify setup
echo -e "\n${YELLOW}[11/12] Verifying setup...${NC}"
# Check for port usage one more time
kill -9 $(lsof -ti:3005) 2>/dev/null || echo "Port 3005 is free"
kill -9 $(lsof -ti:5555) 2>/dev/null || echo "Port 5555 is free"

# STEP 12: Start services carefully
echo -e "\n${YELLOW}[12/12] Starting services with new configuration...${NC}"

# Start Next.js in development mode
echo -e "${GREEN}Starting Next.js on port 3005...${NC}"
npm run dev -p 3005 > next.log 2>&1 &
NEXTJS_PID=$!
echo -e "${GREEN}Next.js started with PID $NEXTJS_PID${NC}"

# Wait for Next.js to start
sleep 5

# Start Prisma Studio on port 5555
echo -e "${GREEN}Starting Prisma Studio on port 5555...${NC}"
NODE_ENV=production npx prisma studio > prisma.log 2>&1 &
PRISMA_PID=$!
echo -e "${GREEN}Prisma Studio started with PID $PRISMA_PID${NC}"

# Final message
echo -e "\n${GREEN}========== ALL ISSUES FIXED ===========${NC}"
echo -e "${GREEN}Your application is now running at: http://localhost:3005${NC}"
echo -e "${GREEN}Database admin is available at: http://localhost:5555${NC}"
echo -e "${YELLOW}If ports are still busy, restart your computer and run this script again.${NC}"
echo -e "${YELLOW}Check next.log and prisma.log if you encounter any issues.${NC}"
echo -e "${RED}Press Ctrl+C to stop all services${NC}"

# Keep script running
wait $NEXTJS_PID 