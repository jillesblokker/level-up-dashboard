import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server-client';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Simple test response
    console.log('[kingdom-events] Test call:', { userId });
    
    return NextResponse.json({ 
      success: true, 
      data: [],
      message: 'Kingdom events API connected'
    });
  } catch (err) {
    console.error('[kingdom-events] Error:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
} 

// Basic telemetry endpoint for tile collects
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    const { tileId, wasLucky, goldEarned, experienceAwarded } = body || {};
    if (!tileId) {
      return NextResponse.json({ error: 'tileId is required' }, { status: 400 });
    }
    const { data, error } = await supabaseServer
      .from('kingdom_event_log')
      .insert([{
        user_id: userId,
        event_type: 'reward',
        related_id: tileId,
        amount: goldEarned ?? null,
        context: { wasLucky, goldEarned, experienceAwarded, kind: 'tile-collect' },
        created_at: new Date().toISOString()
      }])
      .select();
    if (error) {
      return NextResponse.json({ error: 'Failed to record event' }, { status: 500 });
    }
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 });
  }
}