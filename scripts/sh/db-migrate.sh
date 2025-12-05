#!/bin/sh
# Database migration script for production

echo "Generating Prisma client..."
pnpm prisma generate

echo "Running database migrations..."
pnpm prisma migrate deploy

echo "Migration completed successfully!" 