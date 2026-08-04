import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const commitSha = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || '83548e6e';
  return NextResponse.json({
    version: commitSha,
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'production',
  });
}
