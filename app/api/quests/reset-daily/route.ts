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
    
    // Get TODAY's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    console.log('[Daily Reset] 🔍 Today\'s date:', today);
    
    // Get ONLY today's completed quests (not all historical data)
    console.log('[Daily Reset] 🔍 Fetching ONLY today\'s completed quests for user:', userId);
    
    const { data: todayCompletions, error: fetchError } = await supabaseServer
      .from('quest_completion')
      .select('quest_id, completed, completed_at, xp_earned, gold_earned')
      .eq('user_id', userId)
      .eq('completed', true)
      .gte('completed_at', `${today}T00:00:00.000Z`) // Only today's completions
      .lt('completed_at', `${today}T23:59:59.999Z`);

    if (fetchError) {
      console.error('[Daily Reset] Error fetching today\'s completions:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch today\'s completions', details: fetchError }, { status: 500 });
    }
    
    console.log('[Daily Reset] Found', todayCompletions?.length || 0, 'quests completed TODAY to reset');
    console.log('[Daily Reset] 🔍 DEBUG - todayCompletions type:', typeof todayCompletions);
    console.log('[Daily Reset] 🔍 DEBUG - todayCompletions is null:', todayCompletions === null);
    console.log('[Daily Reset] 🔍 DEBUG - todayCompletions is undefined:', todayCompletions === undefined);
    console.log('[Daily Reset] 🔍 DEBUG - todayCompletions length:', todayCompletions?.length);
    
    if (todayCompletions && todayCompletions.length > 0) {
      console.log('[Daily Reset] 🔍 DEBUG - Sample today\'s completions:', todayCompletions.slice(0, 3));
    }

    let resetCount = 0;
    if (todayCompletions && todayCompletions.length > 0) {
      console.log('[Daily Reset] Using UPDATE to reset only today\'s quests (preserving historical data)...');
      console.log('[Daily Reset] 🔍 DEBUG - Entering reset loop with', todayCompletions.length, 'today\'s completed quests');
      
      for (const completion of todayCompletions) {
        try {
          console.log('[Daily Reset] Updating completion record for quest:', completion.quest_id, 'from completed=true to completed=false');
          
          // UPDATE the completed flag to false instead of deleting the record
          const { data: updateResult, error: updateError } = await supabaseServer
            .from('quest_completion')
            .update({ completed: false })
            .eq('user_id', userId)
            .eq('quest_id', completion.quest_id)
            .eq('completed_at', completion.completed_at) // Match the exact timestamp to be safe
            .select();
          
          if (updateError) {
            console.error('[Daily Reset] Error updating quest completion:', completion.quest_id, updateError);
          } else if (updateResult && updateResult.length > 0) {
            resetCount++;
            console.log('[Daily Reset] ✅ Quest completion record updated (not deleted):', completion.quest_id);
          } else {
            console.log('[Daily Reset] ⚠️ No records updated for quest:', completion.quest_id);
          }
        } catch (error) {
          console.error('[Daily Reset] Error processing quest completion:', completion.quest_id, error);
        }
      }
      
      console.log('[Daily Reset] Successfully reset', resetCount, 'out of', todayCompletions.length, 'today\'s completed quests');
      
      // Add delay to ensure database changes are committed
      console.log('[Daily Reset] ⏳ Waiting for database changes to commit...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      
      // Verify the quests were actually reset by checking today's completions
      const { data: verifyCompletions, error: verifyError } = await supabaseServer
        .from('quest_completion')
        .select('quest_id, completed, completed_at')
        .eq('user_id', userId)
        .eq('completed', true)
        .gte('completed_at', `${today}T00:00:00.000Z`)
        .lt('completed_at', `${today}T23:59:59.999Z`);
      
      if (verifyError) {
        console.error('[Daily Reset] Error verifying reset:', verifyError);
      } else {
        console.log('[Daily Reset] 🔍 Verification - quests still completed today after reset:', verifyCompletions?.length || 0);
        if (verifyCompletions && verifyCompletions.length > 0) {
          console.log('[Daily Reset] ⚠️ Some quests are still marked as completed today:', verifyCompletions.map(c => c.quest_id));
        }
      }
    } else {
      console.log('[Daily Reset] No quests completed today to reset');
    }

    // Also reset challenges for today (if they exist)
    console.log('[Daily Reset] Checking for today\'s challenges to reset...');
    const { data: todayChallenges, error: challengesError } = await supabaseServer
      .from('challenge_completion')
      .select('challenge_id, completed, completed_at')
      .eq('user_id', userId)
      .eq('completed', true)
      .gte('completed_at', `${today}T00:00:00.000Z`)
      .lt('completed_at', `${today}T23:59:59.999Z`);

    if (challengesError) {
      console.error('[Daily Reset] Error fetching today\'s challenges:', challengesError);
    } else {
      console.log('[Daily Reset] Found', todayChallenges?.length || 0, 'challenges completed today to reset');
      
      if (todayChallenges && todayChallenges.length > 0) {
        for (const challenge of todayChallenges) {
          try {
            const { error: challengeUpdateError } = await supabaseServer
              .from('challenge_completion')
              .update({ completed: false })
              .eq('user_id', userId)
              .eq('challenge_id', challenge.challenge_id)
              .eq('completed_at', challenge.completed_at);
            
            if (challengeUpdateError) {
              console.error('[Daily Reset] Error updating challenge completion:', challenge.challenge_id, challengeUpdateError);
            } else {
              console.log('[Daily Reset] ✅ Challenge completion record updated:', challenge.challenge_id);
            }
          } catch (error) {
            console.error('[Daily Reset] Error processing challenge completion:', challenge.challenge_id, error);
          }
        }
      }
    }

    console.log('[Daily Reset] Daily reset completed successfully');
    return NextResponse.json({ 
      success: true, 
      message: 'Daily reset completed - today\'s quests reset, all historical data preserved',
      questsReset: resetCount || 0,
      challengesReset: todayChallenges?.length || 0,
      totalCompletedQuests: todayCompletions?.length || 0,
      historicalDataPreserved: true,
      timestamp: new Date().toISOString(),
      debugInfo: {
        todayCompletionsLength: todayCompletions?.length || 0,
        resetCount: resetCount,
        apiVersion: '4.0-historical-preservation-update-only'
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