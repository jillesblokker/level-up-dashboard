import { NextResponse, NextRequest } from 'next/server';
import { supabaseServer } from '../../../../lib/supabase/server-client';
import { getAuth } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Nuclear Reset] Starting nuclear reset for user:', userId);

    // Get ALL completed quests for this user
    const { data: allCompletions, error: fetchError } = await supabaseServer
      .from('quest_completion')
      .select('quest_id, completed_at, xp_earned, gold_earned')
      .eq('user_id', userId)
      .eq('completed', true);

    if (fetchError) {
      console.error('[Nuclear Reset] Error fetching all completions:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch completions', details: fetchError }, { status: 500 });
    }

    console.log('[Nuclear Reset] Found', allCompletions?.length || 0, 'total completed quests to reset');

    let resetCount = 0;
    if (allCompletions && allCompletions.length > 0) {
      console.log('[Nuclear Reset] DIRECT DELETION - Deleting ALL quest completion records...');
      
      // DIRECT DELETION: Delete all quest completion records for this user
      const { error: deleteError, count: deletedCount } = await supabaseServer
        .from('quest_completion')
        .delete()
        .eq('user_id', userId)
        .eq('completed', true);
      
      if (deleteError) {
        console.error('[Nuclear Reset] Direct deletion error:', deleteError);
        return NextResponse.json({ error: 'Failed to delete quest completions', details: deleteError }, { status: 500 });
      }
      
      resetCount = deletedCount || 0;
      console.log('[Nuclear Reset] DIRECT DELETION SUCCESS - Deleted', resetCount, 'quest completion records');
      
      // Verify deletion worked
      const { data: verifyCompletions, error: verifyError } = await supabaseServer
        .from('quest_completion')
        .select('quest_id, completed')
        .eq('user_id', userId)
        .eq('completed', true);
      
      if (verifyError) {
        console.error('[Nuclear Reset] Verification error:', verifyError);
      } else {
        console.log('[Nuclear Reset] VERIFICATION - Remaining completed quests:', verifyCompletions?.length || 0);
      }
    }

    // Also reset challenges
    const { data: allChallenges, error: challengeFetchError } = await supabaseServer
      .from('challenge_completion')
      .select('challenge_id, date')
      .eq('user_id', userId)
      .eq('completed', true);

    let challengeResetCount = 0;
    if (challengeFetchError) {
      console.error('[Nuclear Reset] Error fetching challenge completions:', challengeFetchError);
    } else if (allChallenges && allChallenges.length > 0) {
      // DIRECT DELETION: Delete all challenge completion records
      const { error: challengeDeleteError, count: challengeDeletedCount } = await supabaseServer
        .from('challenge_completion')
        .delete()
        .eq('user_id', userId)
        .eq('completed', true);

      if (challengeDeleteError) {
        console.error('[Nuclear Reset] Error deleting challenges:', challengeDeleteError);
      } else {
        challengeResetCount = challengeDeletedCount || 0;
        console.log('[Nuclear Reset] DIRECT DELETION SUCCESS - Deleted', challengeResetCount, 'challenge completion records');
      }
    }

    console.log('[Nuclear Reset] Nuclear reset completed successfully');
    return NextResponse.json({ 
      success: true, 
      message: 'Nuclear reset completed - ALL quests and challenges have been reset',
      questsReset: resetCount,
      challengesReset: challengeResetCount,
      totalQuestsFound: allCompletions?.length || 0,
      totalChallengesFound: allChallenges?.length || 0
    });

  } catch (error) {
    console.error('[Nuclear Reset] Internal server error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 });
  }
}
