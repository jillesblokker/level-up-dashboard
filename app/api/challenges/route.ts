import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';

export async function GET(request: Request) {
  try {
    // Use authenticated Supabase query with proper Clerk JWT verification
    const result = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
      // Fetch all challenges
      const { data: allChallenges, error: challengesError } = await supabase
        .from('challenges')
        .select('*');
      if (challengesError) {
        throw challengesError;
      }
      
      // Fetch user's challenge completions
      const { data: completions, error: completionError } = await supabase
        .from('challenge_completion')
        .select('*')
        .eq('user_id', userId);
      if (completionError) {
        throw completionError;
      }
      
      // Merge completion state
      const completionMap = new Map();
      completions.forEach((c: any) => completionMap.set(String(c.challenge_id), c));
      const challengesWithCompletion = (allChallenges || []).map((c: any) => {
        const completion = completionMap.get(String(c.id));
        return {
          ...c,
          completed: completion?.completed ?? false,
          completionId: completion?.id,
          date: completion?.date,
        };
      });
      
      return challengesWithCompletion;
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('[Challenges Error]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 