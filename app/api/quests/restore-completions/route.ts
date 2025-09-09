import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server-client';

export async function POST(request: NextRequest) {
  try {
    console.log('[Restore Quest Completions] Starting restore process');
    
    const { userId } = await auth();
    if (!userId) {
      console.error('[Restore Quest Completions] Unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Restore Quest Completions] Authenticated user:', userId);
    
    // Get all quest completions for this user
    const { data: completions, error: fetchError } = await supabaseServer
      .from('quest_completion')
      .select('*')
      .eq('user_id', userId)
      .eq('completed', true);

    if (fetchError) {
      console.error('[Restore Quest Completions] Error fetching completions:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch quest completions' }, { status: 500 });
    }

    console.log('[Restore Quest Completions] Found completions:', completions?.length || 0);

    if (!completions || completions.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No quest completions found to restore',
        restored: 0
      });
    }

    // Calculate total rewards
    const totalXP = completions.reduce((sum, completion) => sum + (completion.xp_earned || 0), 0);
    const totalGold = completions.reduce((sum, completion) => sum + (completion.gold_earned || 0), 0);

    console.log('[Restore Quest Completions] Total rewards:', { totalXP, totalGold });

    // Update character stats with the total rewards
    const { data: currentStats, error: statsError } = await supabaseServer
      .from('character_stats')
      .select('gold, experience, level, health, max_health')
      .eq('user_id', userId)
      .single();

    if (statsError) {
      console.error('[Restore Quest Completions] Error fetching current stats:', statsError);
      return NextResponse.json({ error: 'Failed to fetch current stats' }, { status: 500 });
    }

    const newGold = (currentStats?.gold || 0) + totalGold;
    const newExperience = (currentStats?.experience || 0) + totalXP;

    // Update character stats
    const { error: updateError } = await supabaseServer
      .from('character_stats')
      .upsert({
        user_id: userId,
        gold: newGold,
        experience: newExperience,
        level: currentStats?.level || 1,
        health: currentStats?.health || 100,
        max_health: currentStats?.max_health || 100,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (updateError) {
      console.error('[Restore Quest Completions] Error updating stats:', updateError);
      return NextResponse.json({ error: 'Failed to update character stats' }, { status: 500 });
    }

    // Create transaction records for the restored rewards
    if (totalGold > 0) {
      const { error: goldError } = await supabaseServer
        .from('gold_transactions')
        .insert({
          user_id: userId,
          transaction_type: 'restore',
          amount: totalGold,
          balance_after: newGold,
          source: 'quest_completion_restore',
          description: `Restored ${completions.length} quest completions`,
          metadata: { 
            restored_at: new Date().toISOString(),
            quest_completions: completions.length
          }
        });

      if (goldError) {
        console.error('[Restore Quest Completions] Error creating gold transaction:', goldError);
      }
    }

    if (totalXP > 0) {
      const { error: expError } = await supabaseServer
        .from('experience_transactions')
        .insert({
          user_id: userId,
          transaction_type: 'restore',
          amount: totalXP,
          total_after: newExperience,
          source: 'quest_completion_restore',
          description: `Restored ${completions.length} quest completions`,
          metadata: { 
            restored_at: new Date().toISOString(),
            quest_completions: completions.length
          }
        });

      if (expError) {
        console.error('[Restore Quest Completions] Error creating experience transaction:', expError);
      }
    }

    console.log('[Restore Quest Completions] Successfully restored quest completions');
    return NextResponse.json({ 
      success: true, 
      message: 'Quest completions restored successfully',
      restored: completions.length,
      totalXP,
      totalGold,
      newStats: {
        gold: newGold,
        experience: newExperience
      }
    });

  } catch (error) {
    console.error('[Restore Quest Completions] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
