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
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_live_Y2xlcmsuamlsbGVzYmxva2tlci5jb20k',
  CLERK_SECRET_KEY: 'sk_live_Aft7Tz70m8UnYA1sP4ZYDiPWDGRFN598v58tkhnieO',
  CLERK_WEBHOOK_SECRET: 'whsec_2rC0ctHxt7Y9v4PBC2i23wjeAr+GLdpX',
  
  // Database environment variables
  DATABASE_URL: 'postgres://postgres.uunfpqrauivviygysjzj:Kingdom3000!Levelup!@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
  SHADOW_DATABASE_URL: 'postgres://postgres.uunfpqrauivviygysjzj:Kingdom3000!Levelup!@aws-0-us-east-1.pooler.supabase.com:5432/postgres',
  
  // Node environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Clerk Frontend API
  NEXT_PUBLIC_CLERK_FRONTEND_API: 'https://jillesblokker.com',
} as const;