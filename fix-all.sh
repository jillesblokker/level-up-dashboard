#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "Starting comprehensive fix..."

# Kill any running processes
echo "Killing running processes..."
pkill -f "next"
pkill -f "prisma"

# Clean up node_modules and package-lock
echo "Cleaning up dependencies..."
rm -rf node_modules
rm -rf .next
rm -rf prisma/.prisma
rm -f package-lock.json
rm -f pnpm-lock.yaml

# Remove problematic package from package.json
echo "Removing problematic package..."
sed -i '' '/"@radix-ui\/react-sheet"/d' package.json

# Clean npm cache
echo "Cleaning npm cache..."
npm cache clean --force

# Install dependencies
echo "Installing dependencies..."
npm install

# Install Prisma specifically
echo "Installing Prisma..."
npm install prisma@latest --save-dev
npm install @prisma/client@latest

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Push schema to database
echo "Pushing schema to database..."
npx prisma db push --accept-data-loss

# Start services
echo "Starting services..."
npm run dev & 
sleep 5
npx prisma studio --port 5555 &

echo "Fix completed! Services should be running at:"
echo "- Next.js: http://localhost:3005"
echo "- Prisma Studio: http://localhost:5555" 