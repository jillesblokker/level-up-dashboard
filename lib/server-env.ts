// lib/server-env.ts
export const serverEnv = {
  GITHUB_ID: process.env.GITHUB_ID,
  GITHUB_SECRET: process.env.GITHUB_SECRET,
  DATABASE_URL: process.env.DATABASE_URL,
} as const;

if (!serverEnv.GITHUB_ID) {
  throw new Error('Missing server-only environment variable: GITHUB_ID');
}
if (!serverEnv.GITHUB_SECRET) {
  throw new Error('Missing server-only environment variable: GITHUB_SECRET');
}
if (!serverEnv.DATABASE_URL) {
  throw new Error('Missing server-only environment variable: DATABASE_URL');
}