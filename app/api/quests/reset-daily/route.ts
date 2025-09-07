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

    // Get all quests that were completed today
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const { data: todayCompletions, error: fetchError } = await supabaseServer
      .from('quest_completion')
      .select('quest_id, completed_at, xp_earned, gold_earned')
      .eq('user_id', userId)
      .eq('completed', true)
      .gte('completed_at', today + 'T00:00:00')
      .lt('completed_at', today + 'T23:59:59');

    if (fetchError) {
      console.error('[Daily Reset] Error fetching today\'s completions:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch today\'s completions', details: fetchError }, { status: 500 });
    }

    console.log('[Daily Reset] Found', todayCompletions?.length || 0, 'completions from today');

    // 🚀 USE SMART QUEST COMPLETION SYSTEM FOR DAILY RESET
    // Instead of storing completed: false, we'll delete the completion records
    // This aligns with our smart system philosophy
    let resetCount = 0;
    if (todayCompletions && todayCompletions.length > 0) {
      console.log('[Daily Reset] Using smart system to reset quests...');
      
      // For each quest completed today, use the smart system to "uncomplete" it
      for (const completion of todayCompletions) {
        try {
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
            if (smartResult.success && smartResult.action === 'uncompleted') {
              resetCount++;
            }
          }
        } catch (error) {
          console.error('[Daily Reset] Error processing quest reset:', completion.quest_id, error);
        }
      }
      
      console.log('[Daily Reset] Successfully reset', resetCount, 'out of', todayCompletions.length, 'quests using smart system');
      
      // 🔍 DEBUG: Verify the quests were actually reset by checking the database
      const { data: verifyCompletions, error: verifyError } = await supabaseServer
        .from('quest_completion')
        .select('quest_id, completed')
        .eq('user_id', userId)
        .eq('completed', true)
        .gte('completed_at', today + 'T00:00:00')
        .lt('completed_at', today + 'T23:59:59');
      
      if (verifyError) {
        console.error('[Daily Reset] Error verifying reset:', verifyError);
      } else {
        console.log('[Daily Reset] 🔍 Verification - quests still completed after reset:', verifyCompletions?.length || 0);
        if (verifyCompletions && verifyCompletions.length > 0) {
          console.log('[Daily Reset] 🔍 Still completed quests:', verifyCompletions.map(c => c.quest_id));
        }
      }
    }

    // For challenges, do the same approach
    const { data: todayChallenges, error: challengeFetchError } = await supabaseServer
      .from('challenge_completion')
      .select('challenge_id, date')
      .eq('user_id', userId)
      .eq('completed', true)
      .eq('date', today);

    if (challengeFetchError) {
      console.error('[Daily Reset] Error fetching today\'s challenge completions:', challengeFetchError);
    } else if (todayChallenges && todayChallenges.length > 0) {
      const newChallengeRecords = todayChallenges.map(challenge => ({
        user_id: userId,
        challenge_id: challenge.challenge_id,
        completed: false, // Reset to not completed for the new day
        date: today, // Keep same date but mark as not completed
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

    console.log('[Daily Reset] Daily reset completed successfully');
    return NextResponse.json({ 
      success: true, 
      message: 'Daily reset completed - quests reset for today, historical data preserved',
      questsReset: resetCount || 0,
      challengesReset: todayChallenges?.length || 0
    });

  } catch (error) {
    console.error('[Daily Reset] Internal server error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 });
  }
} 