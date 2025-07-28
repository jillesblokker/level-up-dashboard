import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '../../../../lib/supabase/server-client';
import { grantReward, RewardType } from '../../kingdom/grantReward';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { action } = body;
    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }
    // Get current progress
    const { data: currentProgress, error: fetchError } = await supabaseServer
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows found
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }
    
    // Create or update progress
    const updateData: any = { user_id: userId };
    if (action === 'challenge_completed') updateData.challenges_completed = (currentProgress?.challenges_completed || 0) + 1;
    else if (action === 'exp_gained') updateData.experience = (currentProgress?.experience || 0) + 1;
    else if (action === 'gold_gained') updateData.gold = (currentProgress?.gold || 0) + 1;
    else updateData[action] = (currentProgress?.[action] || 0) + 1;
    
    const { data, error } = await supabaseServer
      .from('user_progress')
      .upsert(updateData, { onConflict: 'user_id' })
      .select()
      .single();
      
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Log the progress increment event (simplified for testing)
    console.log('[progress/increment] Progress updated:', { userId, action, newValue: data?.[action] });
    
    return NextResponse.json({ success: true, newValue: data?.[action] ?? null });
  } catch (err) {
    console.error('[progress/increment] Internal server error:', err);
    return NextResponse.json({
      error: (err as Error).message,
      stack: (err as Error).stack,
      debug: JSON.stringify(err, Object.getOwnPropertyNames(err))
    }, { status: 500 });
  }
} 