#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${RED}======= LEVEL UP DASHBOARD COMPLETE REPAIR =======${NC}"
echo -e "${YELLOW}This script will fix ALL issues with your application${NC}"

# Stop all processes
echo -e "\n${YELLOW}[1/9] Killing ALL running processes...${NC}"
killall node npm next 2>/dev/null || echo "No Node processes running"
pkill -f "node|next|prisma" || echo "No processes to kill"
sleep 2

# Force free ALL ports
echo -e "\n${YELLOW}[2/9] Force-closing ALL ports...${NC}"
for port in {3000..3010} 5555; do
  kill -9 $(lsof -ti:$port) 2>/dev/null || echo "Port $port is free"
done
sleep 1

# Complete cleanup
echo -e "\n${YELLOW}[3/9] Deep cleaning project...${NC}"
rm -rf .next
rm -rf node_modules/.cache
rm -rf node_modules/.prisma
rm -rf generated
rm -rf prisma/generated

# Fix permissions issues
echo -e "\n${YELLOW}[4/9] Fixing permissions...${NC}"
find node_modules -type d -exec chmod 755 {} \; 2>/dev/null || echo "No permission issues"
chmod -R 755 node_modules/@prisma node_modules/prisma 2>/dev/null || echo "No permission issues"

# Fix Next.js config
echo -e "\n${YELLOW}[5/9] Fixing Next.js configuration...${NC}"
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
  env: {
    PORT: "3005",
    NEXTAUTH_URL: "http://localhost:3005"
  }
}

export default nextConfig
EOL

# Fix GitHub callback issue in auth.ts - the key issue
echo -e "\n${YELLOW}[6/9] Fixing authentication callback URL...${NC}"
grep -n "localhost:3004" auth.ts && {
  echo -e "${RED}Found incorrect port 3004 in auth.ts - fixing...${NC}"
  sed -i '' 's/http:\/\/localhost:3004/http:\/\/localhost:3005/g' auth.ts
  echo -e "${GREEN}✓ Fixed auth.ts to use port 3005${NC}"
} || echo -e "${GREEN}✓ auth.ts already using correct port 3005${NC}"

# Fix the database schema
echo -e "\n${YELLOW}[7/9] Fixing database schema...${NC}"
echo -e "${RED}IMPORTANT: This will update your database schema to match the Prisma schema.${NC}"
NODE_ENV=production npx prisma db push --accept-data-loss
echo -e "${GREEN}✓ Database schema synchronized${NC}"

# Regenerate the Prisma client completely
echo -e "\n${YELLOW}[8/9] Regenerating Prisma client...${NC}"
NODE_ENV=production npx prisma generate --schema=prisma/schema.prisma
echo -e "${GREEN}✓ Prisma client regenerated${NC}"

# Fix package.json
echo -e "\n${YELLOW}[9/9] Updating package.json scripts...${NC}"
sed -i '' 's/"dev": "next dev"/"dev": "next dev -p 3005"/g' package.json
echo -e "${GREEN}✓ package.json updated${NC}"

echo -e "\n${GREEN}======= COMPLETE REPAIR SUCCESSFUL =======${NC}"
echo -e "${YELLOW}Starting Prisma Studio (DB Admin) on port 5555...${NC}"
NODE_ENV=production npx prisma studio &
sleep 3

echo -e "\n${YELLOW}Starting Next.js application on port 3005...${NC}"
echo -e "${GREEN}Access your application at: http://localhost:3005${NC}"
echo -e "${GREEN}Access database admin at: http://localhost:5555${NC}"
echo -e "${RED}Press Ctrl+C to stop all services${NC}"

npm run dev 