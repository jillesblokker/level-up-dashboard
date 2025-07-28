import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '../../../../lib/supabase/server-client';
import { grantReward, RewardType } from '../../kingdom/grantReward';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { action } = body;
    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }
    
    // Simple test - just return success without database operations
    console.log('[progress/increment] Test call:', { userId, action });
    
    return NextResponse.json({ success: true, newValue: 1 });
  } catch (err) {
    console.error('[progress/increment] Internal server error:', err);
    return NextResponse.json({
      error: (err as Error).message,
      stack: (err as Error).stack,
      debug: JSON.stringify(err, Object.getOwnPropertyNames(err))
    }, { status: 500 });
  }
} 