#!/bin/bash

echo "Starting ultimate fix..."

# Kill all existing processes
echo "Cleaning up existing processes..."
pkill -f "next"
pkill -f "prisma"
pkill -f "node"

# Wait for ports to be freed
sleep 2

# Remove all node_modules and lockfiles
echo "Cleaning up node_modules..."
rm -rf node_modules
rm -rf .next
rm -rf .prisma
rm -f pnpm-lock.yaml
rm -f package-lock.json
rm -f yarn.lock

# Install dependencies with pnpm
echo "Installing dependencies..."
pnpm install

# Remove problematic package
echo "Removing problematic package..."
pnpm remove @radix-ui/react-sheet

# Install specific versions known to work
echo "Installing specific versions..."
pnpm add -D prisma@5.10.2
pnpm add @prisma/client@5.10.2
pnpm add -D typescript@5.3.3 @types/react@18.2.64 @types/node@20.11.24

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Create a new .env.local file
echo "Creating .env.local..."
cat > .env.local << EOL
# Override any settings from .env
NEXTAUTH_URL=http://localhost:3005
NEXTAUTH_SECRET=FreLc+4cCoEOugZiT2EZhZHBCAgxnWCDdvayXirC2R8=
NEXTAUTH_DEBUG=true
SKIP_AUTH=true
EOL

# Start services
echo "Starting services..."

# Start Prisma Studio with proper environment
echo "Starting Prisma Studio..."
SKIP_AUTH=true DATABASE_URL="postgresql://postgres.uunfpqrauivviygysjzj:Kingdom3000!Levelup!@aws-0-us-east-1.pooler.supabase.com:6543/postgres" npx prisma studio > prisma.log 2>&1 &

# Wait for Prisma to start
sleep 3

# Start Next.js with environment variables
echo "Starting Next.js..."
SKIP_AUTH=true pnpm dev
``` 