import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server-client';
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    logger.info('Monster spawn API called', 'Monster Spawn');

    const { userId } = getAuth(request as NextRequest);
    logger.info(`User ID: ${userId}`, 'Monster Spawn');

    if (!userId) {
      logger.warn('No user ID found', 'Monster Spawn');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    logger.info(`Request body: ${JSON.stringify(body)}`, 'Monster Spawn');

    const { x, y, monsterType } = body;

    if (typeof x !== 'number' || typeof y !== 'number' || typeof monsterType !== 'string') {
      logger.error(`Invalid data types: ${JSON.stringify({ x: typeof x, y: typeof y, monsterType: typeof monsterType })}`, 'Monster Spawn');
      return NextResponse.json({ error: 'Invalid data types' }, { status: 400 });
    }

    const spawnData = {
      user_id: userId,
      x: x,
      y: y,
      monster_type: monsterType,
      spawned_at: new Date().toISOString()
    };

    logger.info(`Attempting to insert spawn data: ${JSON.stringify(spawnData)}`, 'Monster Spawn');

    // Save monster spawn to Supabase
    const { data, error } = await supabaseServer
      .from('monster_spawns')
      .insert(spawnData);

    if (error) {
      logger.error(`Error saving monster spawn: ${error instanceof Error ? error.message : error}`, 'Monster Spawn');
      return NextResponse.json({
        error: 'Failed to save monster spawn',
        details: error.message,
        code: error.code
      }, { status: 500 });
    }

    logger.info(`Monster spawn saved successfully: ${JSON.stringify(data)}`, 'Monster Spawn');
    return NextResponse.json({ success: true, data });
  } catch (error) {
    logger.error(`Unexpected error in monster spawn API: ${error instanceof Error ? error.message : error}`, 'Monster Spawn');
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = getAuth(request as NextRequest);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, defeated, reward_claimed } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing monster ID' }, { status: 400 });
    }

    const updates: any = {};
    if (defeated !== undefined) updates.defeated = defeated;
    if (reward_claimed !== undefined) updates.reward_claimed = reward_claimed;

    const { data, error } = await supabaseServer
      .from('monster_spawns')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select();

    if (error) {
      console.error('Error updating monster spawn:', error);
      return NextResponse.json({ error: 'Failed to update monster' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error in monster spawn PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}