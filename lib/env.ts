import { logger } from "@/lib/logger";
// lib/env.ts
function getEnvOrThrow(key: string): string {
  const value = process.env[key]

  if (!value) {
    logger.error(`Missing environment variable: ${key}`);
    logger.error('Please ensure this variable is set in your .env file');
    throw new Error(`Missing environment variable: ${key}`);
  }

  return value;
}

export const env = {
  // Clerk environment variables
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'] || '',
  CLERK_SECRET_KEY: process.env['CLERK_SECRET_KEY'] || '',
  CLERK_WEBHOOK_SECRET: process.env['CLERK_WEBHOOK_SECRET'] || '',

  // Database environment variables
  DATABASE_URL: process.env['DATABASE_URL'] || '',
  SHADOW_DATABASE_URL: process.env['SHADOW_DATABASE_URL'] || '',

  // Node environment
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Clerk Frontend API
  NEXT_PUBLIC_CLERK_FRONTEND_API: 'https://jillesblokker.com',
} as const;