#!/bin/bash

echo "Starting minimal fix..."

# Kill all processes
pkill -f "node"
pkill -f "prisma"
sleep 2

# Clean up
rm -rf .next
rm -rf node_modules
rm -rf prisma/.prisma
rm -rf prisma/generated
rm -f package-lock.json
rm -f pnpm-lock.yaml
rm -f yarn.lock

# Create minimal package.json
cat > package.json << EOL
{
  "name": "level-up-dashboard",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3005",
    "build": "next build",
    "start": "next start -p 3005"
  },
  "dependencies": {
    "@auth/prisma-adapter": "1.0.14",
    "@prisma/client": "5.10.2",
    "next": "14.1.0",
    "next-auth": "5.0.0-beta.3",
    "react": "18.2.0",
    "react-dom": "18.2.0"
  },
  "devDependencies": {
    "@types/node": "20.11.0",
    "@types/react": "18.2.0",
    "@types/react-dom": "18.2.0",
    "prisma": "5.10.2",
    "typescript": "5.3.3"
  }
}
EOL

# Create minimal next config
cat > next.config.mjs << EOL
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

export default nextConfig
EOL

# Create minimal prisma schema
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
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)
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
  accounts      Account[]
  sessions      Session[]
}
EOL

# Create minimal auth config
cat > auth.ts << EOL
import NextAuth from "next-auth"
import GithubProvider from "next-auth/providers/github"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [GithubProvider({
    clientId: process.env.GITHUB_ID || "",
    clientSecret: process.env.GITHUB_SECRET || ""
  })],
  pages: {
    signIn: "/auth/signin"
  }
})
EOL

# Create minimal auth route
mkdir -p app/api/auth/\[...nextauth\]
cat > app/api/auth/\[...nextauth\]/route.ts << EOL
import { handlers } from "@/auth"
export const GET = handlers
export const POST = handlers
EOL

# Create minimal signin page
mkdir -p app/auth/signin
cat > app/auth/signin/page.tsx << EOL
"use client"
import { useEffect } from "react"
import { signIn } from "next-auth/react"

export default function SignIn() {
  useEffect(() => {
    signIn("github", { callbackUrl: "/" })
  }, [])
  return <div>Redirecting to GitHub...</div>
}
EOL

# Create minimal tsconfig
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

# Install dependencies
echo "Installing dependencies..."
npm install

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Push schema to database
echo "Pushing schema to database..."
npx prisma db push --accept-data-loss

echo "Starting services..."
npm run dev 