import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server-client';
import { apiLogger } from '@/lib/logger';

interface MonsterSpawn {
  user_id: string;
  x: number;
  y: number;
  monster_type: string;
  spawned_at: string;
}

interface UpdateMonsterBody {
  id: string;
  defeated?: boolean;
  reward_claimed?: boolean;
  [key: string]: unknown;
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuth(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { x, y, monsterType } = body;

    if (typeof x !== 'number' || typeof y !== 'number' || typeof monsterType !== 'string') {
      apiLogger.warn(`Invalid data types for monster spawn: x=${typeof x}, y=${typeof y}, type=${typeof monsterType}`);
      return NextResponse.json({ error: 'Invalid data types' }, { status: 400 });
    }

    const spawnData: MonsterSpawn = {
      user_id: userId,
      x: x,
      y: y,
      monster_type: monsterType,
      spawned_at: new Date().toISOString()
    };

    apiLogger.debug(`Attempting to insert spawn data for user ${userId}`);

    // Save monster spawn to Supabase
    const { data, error } = await supabaseServer
      .from('monster_spawns')
      .insert(spawnData)
      .select()
      .single();

    if (error) {
      apiLogger.error('Error saving monster spawn:', error);
      return NextResponse.json({
        error: 'Failed to save monster spawn',
        details: error.message,
        code: error.code
      }, { status: 500 });
    }

    apiLogger.info(`Monster spawn saved successfully: ${data.id}`);
    return NextResponse.json({ success: true, data });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    apiLogger.error('Unexpected error in monster spawn API:', errorMessage);
    return NextResponse.json({
      error: 'Internal server error',
      details: errorMessage
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() as UpdateMonsterBody;
    const { id, defeated, reward_claimed } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing monster ID' }, { status: 400 });
    }

    const updates: Record<string, boolean> = {};
    if (defeated !== undefined) updates['defeated'] = defeated;
    if (reward_claimed !== undefined) updates['reward_claimed'] = reward_claimed;

    apiLogger.debug(`Updating monster spawn ${id} for user ${userId}: ${JSON.stringify(updates)}`);

    const { data, error } = await supabaseServer
      .from('monster_spawns')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select();

    if (error) {
      apiLogger.error('Error updating monster spawn:', error);
      return NextResponse.json({ error: 'Failed to update monster' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    apiLogger.error('Error in monster spawn PUT:', errorMessage);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}