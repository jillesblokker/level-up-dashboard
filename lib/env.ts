// lib/env.ts
function getEnvOrThrow(key: string): string {
  const value = process.env[key]
  
  if (!value) {
    console.error(`Missing environment variable: ${key}`);
    console.error('Please ensure this variable is set in your .env file');
    throw new Error(`Missing environment variable: ${key}`);
  }
  
  return value;
}

export const env = {
  // Clerk environment variables
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: getEnvOrThrow('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'),
  CLERK_SECRET_KEY: getEnvOrThrow('CLERK_SECRET_KEY'),
  CLERK_WEBHOOK_SECRET: getEnvOrThrow('CLERK_WEBHOOK_SECRET'),
  
  // Database environment variables
  DATABASE_URL: getEnvOrThrow('DATABASE_URL'),
  SHADOW_DATABASE_URL: getEnvOrThrow('SHADOW_DATABASE_URL'),
  
  // Node environment
  NODE_ENV: process.env.NODE_ENV || 'development',
} as const;