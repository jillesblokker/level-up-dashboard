import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server-client';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { creatureId } = body;
    if (!creatureId) {
      return NextResponse.json({ error: 'Creature ID is required' }, { status: 400 });
    }
    
    // Simple test - just return success without database operations
    console.log('[creatures/discover] Test call:', { userId, creatureId });
    
    return NextResponse.json({ success: true, alreadyDiscovered: false });
  } catch (err) {
    console.error('[creatures/discover] Error:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
} 