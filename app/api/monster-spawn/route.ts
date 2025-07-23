import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server-client';

export async function POST(request: NextRequest) {
  try {
    console.log('Monster spawn API called');
    
    const { userId } = await auth();
    console.log('User ID:', userId);

    if (!userId) {
      console.log('No user ID found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Request body:', body);
    
    const { x, y, monsterType } = body;
    
    if (typeof x !== 'number' || typeof y !== 'number' || !monsterType) {
      console.log('Invalid data types:', { x: typeof x, y: typeof y, monsterType: typeof monsterType });
      return NextResponse.json({ error: 'Invalid monster spawn data' }, { status: 400 });
    }

    const spawnData = {
      user_id: userId,
      x: x,
      y: y,
      monster_type: monsterType,
      spawned_at: new Date().toISOString()
    };
    
    console.log('Attempting to insert spawn data:', spawnData);

    // Save monster spawn to Supabase
    const { data, error } = await supabaseServer
      .from('monster_spawns')
      .insert(spawnData);

    if (error) {
      console.error('Supabase error saving monster spawn:', error);
      return NextResponse.json({ 
        error: 'Failed to save monster spawn', 
        details: error.message,
        code: error.code 
      }, { status: 500 });
    }

    console.log('Monster spawn saved successfully:', data);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Unexpected error in monster spawn API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 