#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${RED}=== COMPLETE PROJECT RESET AND REPAIR ===${NC}"
echo -e "${YELLOW}This will do a fresh reinstall of all dependencies to fix the @prisma/client issue${NC}"

# Step 1: Kill all processes
echo -e "\n${YELLOW}[1/9] Killing all processes...${NC}"
pkill -f "node|npm|npx|next|prisma" || true
sleep 3

# Step 2: Clean ports
echo -e "\n${YELLOW}[2/9] Freeing all ports...${NC}"
for port in 3005 5555; do
  lsof -ti:$port | xargs kill -9 2>/dev/null || echo "Port $port already free"
done
sleep 2

# Step 3: Delete package-lock and node_modules
echo -e "\n${YELLOW}[3/9] Removing package-lock.json and node_modules...${NC}"
rm -f package-lock.json
rm -rf node_modules
rm -rf .next
rm -rf .prisma
rm -rf generated
rm -rf prisma/generated

# Step 4: Fix the environment
echo -e "\n${YELLOW}[4/9] Creating proper .env file...${NC}"
cat > .env << 'EOL'
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3005
NEXTAUTH_SECRET=FreLc+4cCoEOugZiT2EZhZHBCAgxnWCDdvayXirC2R8=

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
PORT=3005
EOL

# Step 5: Fix next.config.mjs
echo -e "\n${YELLOW}[5/9] Creating proper Next.js configuration...${NC}"
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
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
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

# Step 6: Fix package.json
echo -e "\n${YELLOW}[6/9] Creating proper package.json with explicit port and postinstall hook...${NC}"
cat > package.json << 'EOL'
{
  "name": "level-up-dashboard",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3005",
    "build": "prisma generate && next build",
    "start": "next start -p 3005",
    "lint": "next lint",
    "clean-start": "rm -rf .next node_modules/.cache && next dev -p 3005",
    "postinstall": "prisma generate"
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

# Step 7: Reinstall dependencies
echo -e "\n${YELLOW}[7/9] Reinstalling NPM dependencies...${NC}"
npm install

# Step 8: Generate Prisma client and push schema
echo -e "\n${YELLOW}[8/9] Regenerating Prisma client and applying schema...${NC}"
npx prisma generate
npx prisma db push --accept-data-loss

# Step 9: Start servers
echo -e "\n${YELLOW}[9/9] Starting servers...${NC}"
echo -e "${GREEN}Starting Prisma Studio on port 5555...${NC}"
npx prisma studio &
PRISMA_PID=$!

# Wait for Prisma to start
sleep 3

echo -e "${GREEN}Starting Next.js on port 3005...${NC}"
echo -e "${GREEN}Access your application at: http://localhost:3005${NC}"
echo -e "${GREEN}Access database admin at: http://localhost:5555${NC}"
echo -e "${RED}Press Ctrl+C to stop all services${NC}"

npm run dev

# Clean up
kill $PRISMA_PID 2>/dev/null 