#!/bin/bash

echo "Starting dependency fix..."

# Kill any running processes
pkill -f "node|next|npm|prisma" 2>/dev/null || true

# Clear out all Prisma artifacts
rm -rf node_modules/.prisma
rm -rf .prisma
rm -rf prisma/generated

# Only install Prisma packages directly with exact version numbers
echo "Installing Prisma client directly..."
npm install --no-save @prisma/client@5.10.2
npm install --no-save --save-dev prisma@5.10.2

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Create .prisma directory with symlink as fallback
mkdir -p .prisma
ln -sf ../node_modules/.prisma/client .prisma/client

echo "Starting servers..."
./run-servers.sh 