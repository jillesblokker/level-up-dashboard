function getPublicEnvOrThrow(key: 'NEXT_PUBLIC_SUPABASE_URL' | 'NEXT_PUBLIC_SUPABASE_ANON_KEY'): string {
  // Since this is for client-side code, we need to access window.
  // Next.js replaces process.env with the actual values at build time.
  const value = typeof window !== 'undefined' ? process.env[key] : undefined;

  if (!value) {
    console.error(`Missing environment variable: ${key}`);
    console.error('Please ensure this variable is set in your .env file and prefixed with NEXT_PUBLIC_');
    throw new Error(`Missing environment variable: ${key}`);
  }

  return value;
}

export const clientEnv = {
  NEXT_PUBLIC_SUPABASE_URL: getPublicEnvOrThrow('NEXT_PUBLIC_SUPABASE_URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: getPublicEnvOrThrow('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
} as const; 