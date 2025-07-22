import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server-client';

export async function POST(request: NextRequest) {
  try {
    const { x, y, monsterType } = await request.json();
    
    if (typeof x !== 'number' || typeof y !== 'number' || !monsterType) {
      return NextResponse.json({ error: 'Invalid monster spawn data' }, { status: 400 });
    }

    // Get the user from the request (you'll need to implement auth)
    // For now, we'll use a placeholder user ID
    const userId = 'placeholder-user-id';

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