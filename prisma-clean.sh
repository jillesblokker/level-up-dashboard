#!/bin/bash

echo "Starting Prisma clean reinstall..."

# Kill any running processes
echo "Killing running processes..."
pkill -f "next"
pkill -f "prisma"
sleep 2

# Clean Prisma-related files
echo "Cleaning Prisma files..."
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma
rm -rf prisma/.prisma
rm -rf prisma/generated
rm -rf .next/cache

# Remove Prisma packages
echo "Removing Prisma packages..."
npm uninstall @prisma/client prisma @auth/prisma-adapter

# Clean npm cache
echo "Cleaning npm cache..."
npm cache clean --force

# Install specific versions
echo "Installing Prisma packages..."
npm install prisma@5.10.2 --save-dev
npm install @prisma/client@5.10.2
npm install @auth/prisma-adapter@1.0.14

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Push schema to database
echo "Pushing schema to database..."
npx prisma db push --accept-data-loss

echo "Starting Next.js..."
npm run dev 