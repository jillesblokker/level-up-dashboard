#!/bin/bash

echo "Starting deep fix..."

# Kill all Node-related processes
echo "Killing all Node processes..."
pkill -f "node"
sleep 2

# Remove all generated and cache files
echo "Cleaning up generated files..."
rm -rf .next
rm -rf node_modules
rm -rf .prisma
rm -rf prisma/.prisma
rm -f package-lock.json
rm -f pnpm-lock.yaml
rm -f yarn.lock

# Fix package.json
echo "Fixing package.json..."
# Create backup
cp package.json package.json.backup

# Update package.json to remove problematic packages and ensure correct versions
cat > package.json << EOL
{
  "name": "level-up-dashboard",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3005",
    "build": "next build",
    "start": "next start -p 3005",
    "lint": "next lint"
  },
  "dependencies": {
    "@auth/prisma-adapter": "^1.0.0",
    "@prisma/client": "^5.10.0",
    "next": "14.1.0",
    "next-auth": "^5.0.0-beta.3",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "autoprefixer": "^10.0.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "14.1.0",
    "postcss": "^8.0.0",
    "prisma": "^5.10.0",
    "tailwindcss": "^3.0.0",
    "typescript": "^5.0.0"
  }
}
EOL

# Fix Next.js config
echo "Fixing Next.js config..."
cat > next.config.mjs << EOL
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
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  }
}

export default nextConfig
EOL

# Install dependencies with a clean slate
echo "Installing dependencies..."
npm install

# Setup TypeScript
echo "Setting up TypeScript..."
cat > tsconfig.json << EOL
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOL

# Generate Prisma client with explicit output path
echo "Updating Prisma schema and generating client..."
cat > prisma/schema.prisma << EOL
generator client {
  provider = "prisma-client-js"
  output   = "./generated/client"
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
  character     Character?
  realmMap      RealmMap?
  quests        Quest[]
  achievements  Achievement[]
  kingdom       Kingdom?
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model Character {
  id          String   @id @default(cuid())
  userId      String   @unique
  name        String
  level       Int      @default(1)
  experience  Int      @default(0)
  gold        Int      @default(0)
  inventory   Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model RealmMap {
  id          String   @id @default(cuid())
  userId      String   @unique
  grid        Json
  lastSynced  DateTime @default(now())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Quest {
  id          String   @id @default(cuid())
  userId      String
  title       String
  description String
  completed   Boolean  @default(false)
  rewards     Json?
  completedAt DateTime?
  expiresAt   DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Achievement {
  id          String   @id @default(cuid())
  userId      String
  title       String
  description String
  unlocked    Boolean  @default(false)
  progress    Int      @default(0)
  maxProgress Int      @default(100)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Kingdom {
  id          String   @id @default(cuid())
  userId      String   @unique
  name        String
  resources   Json
  buildings   Json
  population  Int      @default(0)
  happiness   Int      @default(50)
  lastSynced  DateTime @default(now())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
EOL

# Generate Prisma client
npx prisma generate

# Push schema to database
echo "Pushing schema to database..."
npx prisma db push --accept-data-loss

# Start services in the correct order
echo "Starting services..."
echo "1. Starting Prisma Studio..."
npx prisma studio --port 5555 &
sleep 5

echo "2. Starting Next.js..."
npm run dev &

echo "Fix completed! Services are starting..."
echo "- Next.js should be available at: http://localhost:3005"
echo "- Prisma Studio should be available at: http://localhost:5555"
echo "Waiting for services to fully start..."
sleep 10

# Check if services are running
if curl -s http://localhost:3005 > /dev/null; then
  echo "✅ Next.js is running"
else
  echo "❌ Next.js failed to start"
fi

if curl -s http://localhost:5555 > /dev/null; then
  echo "✅ Prisma Studio is running"
else
  echo "❌ Prisma Studio failed to start"
fi 