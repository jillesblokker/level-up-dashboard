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
      console.log('[Nuclear Reset] Using smart system to reset ALL quests...');
      
      // For each completed quest, use the smart system to "uncomplete" it
      for (const completion of allCompletions) {
        try {
          const { data: smartResult, error: smartError } = await supabaseServer.rpc('smart_quest_completion', {
            p_user_id: userId,
            p_quest_id: completion.quest_id as any,
            p_completed: false, // This will delete the record (smart behavior)
            p_xp_reward: 0,
            p_gold_reward: 0
          });
          
          if (smartError) {
            console.error('[Nuclear Reset] Smart completion error for quest:', completion.quest_id, smartError);
          } else if (smartResult) {
            console.log('[Nuclear Reset] Smart completion result for quest:', completion.quest_id, smartResult);
            if (smartResult.success && smartResult.action === 'uncompleted') {
              resetCount++;
            }
          }
        } catch (error) {
          console.error('[Nuclear Reset] Error processing quest reset:', completion.quest_id, error);
        }
      }
      
      console.log('[Nuclear Reset] Successfully reset', resetCount, 'out of', allCompletions.length, 'quests using smart system');
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
      // Reset all challenges to not completed
      const { error: challengeUpdateError } = await supabaseServer
        .from('challenge_completion')
        .update({ completed: false })
        .eq('user_id', userId)
        .eq('completed', true);

      if (challengeUpdateError) {
        console.error('[Nuclear Reset] Error resetting challenges:', challengeUpdateError);
      } else {
        challengeResetCount = allChallenges.length;
        console.log('[Nuclear Reset] Successfully reset', challengeResetCount, 'challenges');
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
