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
    
    // Check if already discovered
    const { data: existing, error: fetchError } = await supabaseServer
      .from('discoveries')
      .select('*')
      .eq('user_id', userId)
      .eq('discovery_id', creatureId)
      .single();
      
    if (existing) {
      return NextResponse.json({ success: true, alreadyDiscovered: true });
    }
    
    // Insert new discovery
    const { error } = await supabaseServer.from('discoveries').insert([
      {
        user_id: userId,
        discovery_id: creatureId,
        discovery_name: `Creature ${creatureId}`,
        description: `Discovered creature ${creatureId}`,
        discovered_at: new Date().toISOString(),
      },
    ]);
    
    if (error) {
      console.error('[creatures/discover] Insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[creatures/discover] Error:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
} 