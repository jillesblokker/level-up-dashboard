// lib/server-env.ts
function getServerEnvOrThrow(key: 'GITHUB_ID' | 'GITHUB_SECRET' | 'DATABASE_URL'): string {
  const value = process.env[key];

  if (!value) {
    console.error(`Missing server-only environment variable: ${key}`);
    throw new Error(`Missing server-only environment variable: ${key}`);
  }

  return value;
}

export const serverEnv = {
  GITHUB_ID: getServerEnvOrThrow('GITHUB_ID'),
  GITHUB_SECRET: getServerEnvOrThrow('GITHUB_SECRET'),
  DATABASE_URL: getServerEnvOrThrow('DATABASE_URL'),
} as const;