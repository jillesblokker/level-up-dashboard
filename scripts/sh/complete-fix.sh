#!/bin/bash

echo "Starting complete fix..."

# Kill any existing processes
echo "Cleaning up existing processes..."
pkill -f "next"
pkill -f "prisma"
pkill -f "node"

# Wait for ports to be freed
sleep 2

# Remove problematic package from package.json
echo "Removing problematic package..."
sed -i '' '/"@radix-ui\/react-sheet"/d' package.json

# Install TypeScript dependencies
echo "Installing TypeScript dependencies..."
pnpm add -D typescript@latest @types/react@latest @types/node@latest

# Install Prisma dependencies
echo "Installing Prisma dependencies..."
pnpm add -D prisma@latest
pnpm add @prisma/client@latest

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Start services
echo "Starting services..."

# Start Prisma Studio in background
npx prisma studio > prisma.log 2>&1 &
PRISMA_PID=$!

# Wait for Prisma to start
sleep 3

# Start Next.js in development mode
echo "Starting Next.js..."
pnpm dev 