import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

export async function GET(req: NextRequest) {
  try {
    console.log('[Milestones Simple] Starting basic test');
    
    // Use the same auth pattern as working endpoints
    const { userId } = await getAuth(req);
    console.log('[Milestones Simple] Got userId:', userId);
    
    if (!userId) {
      console.log('[Milestones Simple] No userId, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Milestones Simple] Returning empty array for testing');
    // Just return empty array to test if the endpoint works at all
    return NextResponse.json([]);

  } catch (error) {
    console.error('[Milestones Simple] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 