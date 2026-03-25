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
    logger.debug('[character-perks] Test call:', { userId });
    
    return NextResponse.json({ 
      success: true, 
      data: [],
      message: 'Character perks API connected'
    });
  } catch (err) {
    logger.error('[character-perks] Error:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
} 