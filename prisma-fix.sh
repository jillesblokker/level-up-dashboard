#!/bin/bash

echo "Starting Prisma fix..."

# Kill any running Prisma processes
pkill -f "prisma"
sleep 2

# Remove all Prisma-related files and caches
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma
rm -rf prisma/.prisma
rm -rf prisma/generated
rm -rf .next/cache

# Remove the problematic packages
npm uninstall @prisma/client prisma @prisma/adapter-pg

# Clean npm cache
npm cache clean --force

# Install specific versions known to work together
npm install prisma@5.10.2 --save-dev
npm install @prisma/client@5.10.2

# Update schema to use a simpler configuration
cat > prisma/schema.prisma << EOL
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  isAdmin       Boolean   @default(false)
  accounts      Account[]
  sessions      Session[]
}
EOL

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Push schema to database
echo "Pushing schema to database..."
npx prisma db push --accept-data-loss

echo "Starting Prisma Studio..."
npx prisma studio --port 5555 