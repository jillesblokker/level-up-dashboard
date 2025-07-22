import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server-client';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { x, y, monsterType } = await request.json();
    
    if (typeof x !== 'number' || typeof y !== 'number' || !monsterType) {
      return NextResponse.json({ error: 'Invalid monster spawn data' }, { status: 400 });
    }

    // Save monster spawn to Supabase
    const { data, error } = await supabaseServer
      .from('monster_spawns')
      .insert({
        user_id: userId,
        x: x,
        y: y,
        monster_type: monsterType,
        spawned_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error saving monster spawn:', error);
      return NextResponse.json({ error: 'Failed to save monster spawn' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error in monster spawn API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 