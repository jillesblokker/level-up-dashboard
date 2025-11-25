#!/bin/bash

echo "Fixing module resolution issues..."

# Kill any running processes
pkill -f "node|next|npm|prisma" 2>/dev/null || true

# Clear out all build artifacts
rm -rf .next
rm -rf node_modules/.cache
rm -rf node_modules/.prisma
rm -rf .prisma
rm -rf prisma/generated

# Remove and reinstall @prisma/client
echo "Reinstalling @prisma/client and Prisma..."
npm uninstall @prisma/client prisma
npm install --save @prisma/client@latest
npm install --save-dev prisma@latest

# Create a proper Prisma client generator
echo "Setting up Prisma client with explicit output path..."
npx prisma generate --generator client --output ./node_modules/.prisma/client

# Also create a link to satisfy the default path
mkdir -p .prisma
ln -sf ./node_modules/.prisma/client .prisma/client

echo "Module issues fixed. Now run ./run-servers.sh to start the application." 