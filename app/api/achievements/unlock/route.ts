import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '../../../../lib/supabase/server-client';
import { Database } from '@/types/supabase';
import { grantReward } from '../../kingdom/grantReward';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    console.log('Achievement unlock request - userId:', userId);

    if (!userId) {
      console.log('No userId found in auth');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { achievementId } = body;
    console.log('Achievement unlock request - achievementId:', achievementId);

    if (!achievementId) {
      console.log('No achievementId provided in request body');
      return NextResponse.json({ error: 'Achievement ID is required' }, { status: 400 });
    }

    // Check if achievement is already unlocked in Supabase
    console.log('Checking if achievement already exists...');
    const { data: existing, error: fetchError } = await supabaseServer
      .from('achievements')
      .select('*')
      .eq('user_id', userId)
      .eq('achievement_id', achievementId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching existing achievement:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (existing) {
      console.log('Achievement already unlocked:', existing);
      return NextResponse.json({ 
        success: true, 
        achievementId,
        message: 'Achievement already unlocked',
        alreadyUnlocked: true
      });
    }

    // Insert new achievement unlock into Supabase
    console.log('Inserting new achievement unlock...');
    const { error } = await supabaseServer.from('achievements').insert([
      {
        user_id: userId,
        achievement_id: achievementId,
        achievement_name: achievementId, // You may want to look up the name elsewhere
        unlocked_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error('Error unlocking achievement in Supabase:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Achievement unlocked successfully, logging reward...');

    // Log the achievement unlock as a reward event
    try {
      await grantReward({
        userId,
        type: 'achievement',
        relatedId: achievementId,
        context: { source: 'achievement_unlock' }
      });
    } catch (rewardError) {
      console.error('Error granting reward:', rewardError);
      // Don't fail the whole request if reward logging fails
    }

    console.log(`Achievement unlocked in Supabase: ${achievementId} for user: ${userId}`);

    return NextResponse.json({ 
      success: true, 
      achievementId,
      message: 'Achievement unlocked successfully',
    });
  } catch (error) {
    console.error('Error unlocking achievement:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 