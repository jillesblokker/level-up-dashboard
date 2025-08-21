import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { supabaseServer } from '../../../../lib/supabase/server-client';

const supabase = supabaseServer;

export async function GET(request: Request) {
  try {
    // Add timeout handling
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 8000); // 8 second timeout
    });

    const { userId } = getAuth(request as any);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Simple Quest API] User ID:', userId);

    const queryPromise = (async () => {
      // 1. Get all challenges (quest definitions)
      const { data: challenges, error: challengesError } = await supabase
        .from('challenges')
        .select('*');

      if (challengesError) {
        console.error('[Simple Quest API] Challenges error:', challengesError);
        return NextResponse.json({ error: challengesError.message }, { status: 500 });
      }

      console.log('[Simple Quest API] Challenges fetched:', challenges?.length || 0);

      // 2. Get user's quest completions
      const { data: completions, error: completionsError } = await supabase
        .from('quest_completion')
        .select('*')
        .eq('user_id', userId);

      if (completionsError) {
        console.error('[Simple Quest API] Completions error:', completionsError);
        return NextResponse.json({ error: completionsError.message }, { status: 500 });
      }

      console.log('[Simple Quest API] Completions fetched:', completions?.length || 0);

      // 3. Count completed quests
      const completedCount = completions?.filter(c => c.completed === true && c.completed_at !== null).length || 0;
      const incompleteCount = completions?.filter(c => c.completed === false || c.completed_at === null).length || 0;

      console.log('[Simple Quest API] Counts:', { completed: completedCount, incomplete: incompleteCount });

      // 4. Return simple summary
      return NextResponse.json({
        userId,
        challengesCount: challenges?.length || 0,
        completionsCount: completions?.length || 0,
        completedQuests: completedCount,
        incompleteQuests: incompleteCount,
        sampleCompletions: completions?.slice(0, 3) || [],
        sampleChallenges: challenges?.slice(0, 3) || []
      });
    })();

    // Race between timeout and query
    const result = await Promise.race([queryPromise, timeoutPromise]) as any;

    return result;
  } catch (error) {
    console.error('[Simple Quest API] Error:', error);
    
    // Handle timeout specifically
    if (error instanceof Error && error.message === 'Request timeout') {
      return NextResponse.json(
        { error: 'Request timeout - please try again' }, 
        { status: 408 }
      );
    }
    
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
