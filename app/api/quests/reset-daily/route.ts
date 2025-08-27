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

    // Instead of setting completed = false (which erases history),
    // we'll add a new record for today with completed = false
    // This preserves historical completion data for charts
    
    // Get all quests that were completed today
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const { data: todayCompletions, error: fetchError } = await supabaseServer
      .from('quest_completion')
      .select('quest_id, completed_at')
      .eq('user_id', userId)
      .eq('completed', true)
      .gte('completed_at', today + 'T00:00:00')
      .lt('completed_at', today + 'T23:59:59');

    if (fetchError) {
      console.error('[Daily Reset] Error fetching today\'s completions:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch today\'s completions', details: fetchError }, { status: 500 });
    }

    console.log('[Daily Reset] Found', todayCompletions?.length || 0, 'completions from today');

    // For each quest completed today, create a new record for tomorrow
    // This allows the UI to show unchecked boxes while preserving completion history
    if (todayCompletions && todayCompletions.length > 0) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const newRecords = todayCompletions.map(completion => ({
        user_id: userId,
        quest_id: completion.quest_id,
        completed: false, // New day, not completed yet
        completed_at: new Date().toISOString(), // Set to current timestamp to satisfy NOT NULL constraint
        gold_earned: 0, // Reset for new day
        xp_earned: 0, // Reset for new day
        // Add a reference to the original completion
        original_completion_date: completion.completed_at
      }));

      const { error: insertError } = await supabaseServer
        .from('quest_completion')
        .upsert(newRecords, {
          onConflict: 'user_id,quest_id',
          ignoreDuplicates: false
        });

      if (insertError) {
        console.error('[Daily Reset] Error creating new daily records:', insertError);
        return NextResponse.json({ error: 'Failed to create new daily records', details: insertError }, { status: 500 });
      }

      console.log('[Daily Reset] Successfully created', newRecords.length, 'new daily records');
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
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const newChallengeRecords = todayChallenges.map(challenge => ({
        user_id: userId,
        challenge_id: challenge.challenge_id,
        completed: false, // New day, not completed yet
        date: tomorrowStr,
        original_completion_date: challenge.date
      }));

      const { error: challengeInsertError } = await supabaseServer
        .from('challenge_completion')
        .insert(newChallengeRecords);

      if (challengeInsertError) {
        console.error('[Daily Reset] Error creating new daily challenge records:', challengeInsertError);
      } else {
        console.log('[Daily Reset] Successfully created', newChallengeRecords.length, 'new daily challenge records');
      }
    }

    console.log('[Daily Reset] Daily reset completed successfully');
    return NextResponse.json({ 
      success: true, 
      message: 'Daily reset completed - historical data preserved',
      questsReset: todayCompletions?.length || 0,
      challengesReset: todayChallenges?.length || 0
    });

  } catch (error) {
    console.error('[Daily Reset] Internal server error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 });
  }
} 