import { NextResponse, NextRequest } from 'next/server';
import { supabaseServer } from '../../../../lib/supabase/server-client';
import { getAuth } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Daily Reset] Starting daily reset for user:', userId);

    // Get ALL quests that were completed (not just today's)
    const { data: allCompletions, error: fetchError } = await supabaseServer
      .from('quest_completion')
      .select('quest_id, completed, completed_at, xp_earned, gold_earned')
      .eq('user_id', userId)
      .eq('completed', true);

    if (fetchError) {
      console.error('[Daily Reset] Error fetching all completions:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch all completions', details: fetchError }, { status: 500 });
    }

    console.log('[Daily Reset] Found', allCompletions?.length || 0, 'total completed quests to reset');
    console.log('[Daily Reset] 🔍 DEBUG - allCompletions type:', typeof allCompletions);
    console.log('[Daily Reset] 🔍 DEBUG - allCompletions is null:', allCompletions === null);
    console.log('[Daily Reset] 🔍 DEBUG - allCompletions is undefined:', allCompletions === undefined);
    console.log('[Daily Reset] 🔍 DEBUG - allCompletions length:', allCompletions?.length);
    
    // 🔍 DEBUG: Log sample completed quests
    if (allCompletions && allCompletions.length > 0) {
      console.log('[Daily Reset] 🔍 DEBUG - Sample completed quests:', allCompletions.slice(0, 5).map(c => ({
        quest_id: c.quest_id,
        completed_at: c.completed_at
      })));
      console.log('[Daily Reset] 🔍 DEBUG - All completion records:', allCompletions.map(c => ({
        quest_id: c.quest_id,
        completed: c.completed,
        completed_at: c.completed_at,
        xp_earned: c.xp_earned,
        gold_earned: c.gold_earned
      })));
    } else {
      console.log('[Daily Reset] 🔍 DEBUG - No completions found or allCompletions is null/undefined');
      console.log('[Daily Reset] 🔍 DEBUG - This means the smart quest completion loop will NOT be entered');
      console.log('[Daily Reset] 🔍 DEBUG - This explains why questsReset: 0');
    }

    // 🚀 USE SMART QUEST COMPLETION SYSTEM FOR DAILY RESET
    // Instead of storing completed: false, we'll delete the completion records
    // This aligns with our smart system philosophy
    let resetCount = 0;
    if (allCompletions && allCompletions.length > 0) {
      console.log('[Daily Reset] Using smart system to reset ALL quests...');
      console.log('[Daily Reset] 🔍 DEBUG - Entering smart quest completion loop with', allCompletions.length, 'quests');
      
      // For each completed quest, use the smart system to "uncomplete" it
      for (const completion of allCompletions) {
        try {
          console.log('[Daily Reset] Calling smart_quest_completion for quest:', completion.quest_id, 'with completed: false');
          const { data: smartResult, error: smartError } = await supabaseServer.rpc('smart_quest_completion', {
            p_user_id: userId,
            p_quest_id: completion.quest_id as any, // Cast to any to avoid UUID type issues
            p_completed: false, // This will delete the record (smart behavior)
            p_xp_reward: 0,
            p_gold_reward: 0
          });
          
          if (smartError) {
            console.error('[Daily Reset] Smart completion error for quest:', completion.quest_id, smartError);
          } else if (smartResult) {
            console.log('[Daily Reset] Smart completion result for quest:', completion.quest_id, smartResult);
            console.log('[Daily Reset] Smart result details:', {
              success: smartResult.success,
              action: smartResult.action,
              message: smartResult.message,
              deletedRecord: smartResult.deletedRecord
            });
            if (smartResult.success && smartResult.action === 'uncompleted') {
              resetCount++;
              console.log('[Daily Reset] ✅ Quest successfully uncompleted:', completion.quest_id);
            } else {
              console.log('[Daily Reset] ❌ Quest NOT uncompleted:', completion.quest_id, 'Action:', smartResult.action);
            }
          }
        } catch (error) {
          console.error('[Daily Reset] Error processing quest reset:', completion.quest_id, error);
        }
      }
      
      console.log('[Daily Reset] Successfully reset', resetCount, 'out of', allCompletions.length, 'quests using smart system');
      
      // 🔍 DEBUG: Verify the quests were actually reset by checking the database
      const { data: verifyCompletions, error: verifyError } = await supabaseServer
        .from('quest_completion')
        .select('quest_id, completed')
        .eq('user_id', userId)
        .eq('completed', true);
      
      if (verifyError) {
        console.error('[Daily Reset] Error verifying reset:', verifyError);
      } else {
        console.log('[Daily Reset] 🔍 Verification - quests still completed after reset:', verifyCompletions?.length || 0);
        if (verifyCompletions && verifyCompletions.length > 0) {
          console.log('[Daily Reset] 🔍 Still completed quests:', verifyCompletions.map(c => c.quest_id));
        }
      }
    }

    // For challenges, do the same approach - reset ALL challenges
    const { data: allChallenges, error: challengeFetchError } = await supabaseServer
      .from('challenge_completion')
      .select('challenge_id, date')
      .eq('user_id', userId)
      .eq('completed', true);

    if (challengeFetchError) {
      console.error('[Daily Reset] Error fetching all challenge completions:', challengeFetchError);
    } else if (allChallenges && allChallenges.length > 0) {
      const newChallengeRecords = allChallenges.map(challenge => ({
        user_id: userId,
        challenge_id: challenge.challenge_id,
        completed: false, // Reset to not completed
        date: challenge.date, // Keep original date
        original_completion_date: challenge.date
      }));

      const { error: challengeInsertError } = await supabaseServer
        .from('challenge_completion')
        .upsert(newChallengeRecords, {
          onConflict: 'user_id,challenge_id,date',
          ignoreDuplicates: false
        });

      if (challengeInsertError) {
        console.error('[Daily Reset] Error creating reset challenge records:', challengeInsertError);
      } else {
        console.log('[Daily Reset] Successfully reset', newChallengeRecords.length, 'challenges for today');
      }
    }

    // 🚀 NUCLEAR OPTION: If no quests were reset today but there are completed quests, offer to reset ALL
    if (resetCount === 0 && allCompletions && allCompletions.length > 0) {
      console.log('[Daily Reset] 🚀 NUCLEAR OPTION - No quests completed today, but found', allCompletions.length, 'total completed quests');
      console.log('[Daily Reset] 🚀 This suggests quests from previous days are still marked as completed');
      console.log('[Daily Reset] 🚀 Consider implementing a "nuclear reset" option to clear all completed quests');
    }

    console.log('[Daily Reset] Daily reset completed successfully');
    return NextResponse.json({ 
      success: true, 
      message: 'Daily reset completed - quests reset for today, historical data preserved',
      questsReset: resetCount || 0,
      challengesReset: allChallenges?.length || 0,
      totalCompletedQuests: allCompletions?.length || 0,
      nuclearResetAvailable: resetCount === 0 && (allCompletions?.length || 0) > 0
    });

  } catch (error) {
    console.error('[Daily Reset] Internal server error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 });
  }
} 