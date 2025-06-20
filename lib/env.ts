// lib/env.ts
function getEnvOrThrow(key: string): string {
  const value = process.env[key]
  
  if (!value) {
    console.error(`Missing environment variable: ${key}`);
    console.error('Please ensure this variable is set in your .env file');
    throw new Error(`Missing environment variable: ${key}`);
  }
  
  // Special validation for Supabase URL
  if (key === 'NEXT_PUBLIC_SUPABASE_URL') {
    try {
      new URL(value);
    } catch (error) {
      console.error('Invalid Supabase URL format:', value);
      console.error('URL should be in the format: https://your-project-id.supabase.co');
      throw new Error('Invalid Supabase URL format');
    }
  }
  
  return value;
}

export const env = {
  NEXT_PUBLIC_SUPABASE_URL: process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
} as const;

if (!env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
}

if (!env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY');
}