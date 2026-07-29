import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const { userId } = await auth();
    return NextResponse.json({
      status: 'healthy',
      authenticated: !!userId,
      userId: userId || null,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('[Auth Test API] Error testing auth:', error);
    return NextResponse.json({
      status: 'error',
      authenticated: false,
      error: error.message || 'Authentication check failed',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
