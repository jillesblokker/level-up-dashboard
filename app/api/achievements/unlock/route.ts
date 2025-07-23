import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '../../../../lib/supabase/server-client';
import { Database } from '@/types/supabase';
import { grantReward } from '../../kingdom/grantReward';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    console.log('[ACHIEVEMENTS][UNLOCK] User ID from Clerk:', userId);

    if (!userId) {
      console.log('[ACHIEVEMENTS][UNLOCK] No userId found in auth');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { achievementId } = body;
    console.log('[ACHIEVEMENTS][UNLOCK] Achievement ID from request:', achievementId);

    if (!achievementId) {
      console.log('[ACHIEVEMENTS][UNLOCK] No achievementId provided in request body');
      return NextResponse.json({ error: 'Achievement ID is required' }, { status: 400 });
    }

    // Check if achievement is already unlocked in Supabase
    console.log('[ACHIEVEMENTS][UNLOCK] Checking if achievement already exists...');
    const { data: existing, error: fetchError } = await supabaseServer
      .from('achievements')
      .select('*')
      .eq('user_id', userId)
      .eq('achievement_id', achievementId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('[ACHIEVEMENTS][UNLOCK] Error fetching existing achievement:', fetchError);
      return NextResponse.json({ 
        error: fetchError.message, 
        code: fetchError.code,
        details: fetchError.details 
      }, { status: 500 });
    }

    if (existing) {
      console.log('[ACHIEVEMENTS][UNLOCK] Achievement already unlocked:', existing);
      return NextResponse.json({ 
        success: true, 
        achievementId,
        message: 'Achievement already unlocked',
        alreadyUnlocked: true
      });
    }

    // Insert new achievement unlock into Supabase
    console.log('[ACHIEVEMENTS][UNLOCK] Inserting new achievement unlock...');
    const { error: insertError } = await supabaseServer.from('achievements').insert([
      {
        user_id: userId,
        achievement_id: achievementId,
        achievement_name: achievementId, // You may want to look up the name elsewhere
        unlocked_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);

    if (insertError) {
      console.error('[ACHIEVEMENTS][UNLOCK] Error unlocking achievement in Supabase:', insertError);
      return NextResponse.json({ 
        error: insertError.message, 
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint
      }, { status: 500 });
    }

    console.log('[ACHIEVEMENTS][UNLOCK] Achievement unlocked successfully, logging reward...');

    // Log the achievement unlock as a reward event
    try {
      await grantReward({
        userId,
        type: 'achievement',
        relatedId: achievementId,
        context: { source: 'achievement_unlock' }
      });
      console.log('[ACHIEVEMENTS][UNLOCK] Reward logged successfully');
    } catch (rewardError) {
      console.error('[ACHIEVEMENTS][UNLOCK] Error granting reward:', rewardError);
      // Don't fail the whole request if reward logging fails
      // Return success but with a warning
      return NextResponse.json({ 
        success: true, 
        achievementId,
        message: 'Achievement unlocked successfully (reward logging failed)',
        warning: 'Reward logging failed but achievement was unlocked'
      });
    }

    console.log(`[ACHIEVEMENTS][UNLOCK] Achievement unlocked in Supabase: ${achievementId} for user: ${userId}`);

    return NextResponse.json({ 
      success: true, 
      achievementId,
      message: 'Achievement unlocked successfully',
    });
  } catch (error) {
    console.error('[ACHIEVEMENTS][UNLOCK] Internal server error:', error instanceof Error ? error.stack : error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 