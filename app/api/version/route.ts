import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const env = process.env as Record<string, string | undefined>;
  const commitSha = env['NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA'] || env['VERCEL_GIT_COMMIT_SHA'] || '74619bb2';
  return NextResponse.json({
    version: commitSha,
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'production',
  });
}
