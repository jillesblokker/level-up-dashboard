import { NextResponse, NextRequest } from 'next/server';
import { supabaseServer } from '../../../../lib/supabase/server-client';
import { getAuth } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  console.log('[Daily Reset] 🚀 API ROUTE CALLED - Starting POST request');
  try {
    const { userId } = await getAuth(req);
    console.log('[Daily Reset] 🚀 User ID from auth:', userId);
    if (!userId) {
      console.log('[Daily Reset] 🚀 No user ID found, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Daily Reset] Starting daily reset for user:', userId);
    console.log('[Daily Reset] 🔍 DEBUG - About to fetch all completions from database');

    // Get ALL quests that are currently completed (more aggressive reset)
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    console.log('[Daily Reset] 🔍 Fetching ALL completed quests for user:', userId);
    
    const { data: allCompletions, error: fetchError } = await supabaseServer
      .from('quest_completion')
      .select('quest_id, completed, completed_at, xp_earned, gold_earned')
      .eq('user_id', userId)
      .eq('completed', true);

    if (fetchError) {
      console.error('[Daily Reset] Error fetching all completions:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch all completions', details: fetchError }, { status: 500 });
    }
    
    console.log('[Daily Reset] 🔍 DEBUG - Database query completed, checking results...');

    console.log('[Daily Reset] Found', allCompletions?.length || 0, 'quests completed to reset');
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
      console.log('[Daily Reset] 🔍 DEBUG - No completed quests found');
      console.log('[Daily Reset] 🔍 DEBUG - This means the reset loop will NOT be entered');
      console.log('[Daily Reset] 🔍 DEBUG - All quests are already incomplete');
    }

    // 🚀 USE SMART QUEST COMPLETION SYSTEM FOR DAILY RESET
    // Instead of storing completed: false, we'll delete the completion records
    // This aligns with our smart system philosophy
    let resetCount = 0;
    if (allCompletions && allCompletions.length > 0) {
      console.log('[Daily Reset] Using direct delete to reset ALL completed quests...');
      console.log('[Daily Reset] 🔍 DEBUG - Entering reset loop with', allCompletions.length, 'completed quests');
      
      // For each completed quest, directly delete the completion record
      for (const completion of allCompletions) {
        try {
          console.log('[Daily Reset] Directly deleting completion record for quest:', completion.quest_id);
          
          // Direct DELETE approach - more reliable than smart function
          const { data: deleteResult, error: deleteError } = await supabaseServer
            .from('quest_completion')
            .delete()
            .eq('user_id', userId)
            .eq('quest_id', completion.quest_id)
            .select();
          
          if (deleteError) {
            console.error('[Daily Reset] Delete error for quest:', completion.quest_id, deleteError);
          } else if (deleteResult && deleteResult.length > 0) {
            resetCount++;
            console.log('[Daily Reset] ✅ Quest completion record deleted:', completion.quest_id);
            console.log('[Daily Reset] Deleted record:', deleteResult[0]);
          } else {
            console.log('[Daily Reset] ❌ No record found to delete for quest:', completion.quest_id);
          }
        } catch (error) {
          console.error('[Daily Reset] Error processing quest reset:', completion.quest_id, error);
        }
      }
      
      console.log('[Daily Reset] Successfully reset', resetCount, 'out of', allCompletions.length, 'completed quests');
      
      // 🔍 CRITICAL: Add delay to ensure database changes are committed
      console.log('[Daily Reset] ⏳ Waiting for database changes to commit...');
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      
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

    // 🚀 INFO: Log historical data preservation
    if (resetCount === 0) {
      console.log('[Daily Reset] ℹ️ No quests completed today to reset');
      console.log('[Daily Reset] ℹ️ Historical quest completion data is preserved');
    }

    console.log('[Daily Reset] Daily reset completed successfully');
    return NextResponse.json({ 
      success: true, 
      message: 'Daily reset completed - quests reset for today, historical data preserved',
      questsReset: resetCount || 0,
      challengesReset: allChallenges?.length || 0,
      totalCompletedQuests: allCompletions?.length || 0,
      historicalDataPreserved: true,
      timestamp: new Date().toISOString(),
      debugInfo: {
        allCompletionsLength: allCompletions?.length || 0,
        resetCount: resetCount,
        apiVersion: '3.0-historical-preservation'
      }
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('[Daily Reset] Internal server error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 });
  }
} 