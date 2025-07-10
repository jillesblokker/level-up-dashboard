import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '../../../pages/api/server-client';

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Fetch all challenges
    const { data: allChallenges, error: challengesError } = await supabaseServer
      .from('challenges')
      .select('*');
    if (challengesError) {
      return NextResponse.json({ error: challengesError.message }, { status: 500 });
    }
    // Fetch user's challenge completions
    const { data: completions, error: completionError } = await supabaseServer
      .from('challenge_completion')
      .select('*')
      .eq('user_id', userId);
    if (completionError) {
      return NextResponse.json({ error: completionError.message }, { status: 500 });
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
    return NextResponse.json(challengesWithCompletion);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 