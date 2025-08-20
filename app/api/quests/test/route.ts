import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { supabaseServer } from '../../../../lib/supabase/server-client';

export async function GET(request: Request) {
  try {
    const { userId } = getAuth(request as any);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = supabaseServer;

    // 1. Get all quest completions
    const { data: completions, error: completionsError } = await supabase
      .from('quest_completion')
      .select('*')
      .eq('user_id', userId);

    // 2. Get all challenges
    const { data: challenges, error: challengesError } = await supabase
      .from('challenges')
      .select('id, name, title');

    // 3. Show detailed analysis
    const analysis = completions?.map(completion => {
      const matchingChallengeById = challenges?.find(c => c.id === completion.quest_id);
      const matchingChallengeByName = challenges?.find(c => c.name === completion.quest_id);
      
      return {
        completion_id: completion.id,
        quest_id: completion.quest_id,
        completed: completion.completed,
        completed_at: completion.completed_at,
        matches_by_id: !!matchingChallengeById,
        matches_by_name: !!matchingChallengeByName,
        challenge_id: matchingChallengeById?.id || 'NO MATCH',
        challenge_name: matchingChallengeByName?.name || 'NO MATCH',
        is_completed: completion.completed === true && completion.completed_at !== null
      };
    }) || [];

    return NextResponse.json({
      userId,
      completions_count: completions?.length || 0,
      challenges_count: challenges?.length || 0,
      analysis,
      sample_completions: completions?.slice(0, 3) || [],
      sample_challenges: challenges?.slice(0, 3) || []
    });

  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
