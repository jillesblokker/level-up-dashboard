import { logger } from "@/lib/logger";
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Simple test response
    logger.debug('[daily-tasks] Test call:', { userId });
    
    return NextResponse.json({ 
      success: true, 
      data: [],
      message: 'Daily tasks API connected'
    });
  } catch (err) {
    logger.error('[daily-tasks] Error:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
} 