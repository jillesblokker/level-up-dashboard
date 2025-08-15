import { NextResponse, NextRequest } from 'next/server';
import { supabaseServer } from '../../../../lib/supabase/server-client';
import { getAuth } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Reset all quests for the user
    const { error: questError } = await supabaseServer
      .from('quest_completion')
      .update({ completed: false })
      .eq('user_id', userId);
    // Reset all challenges for the user
    const { error: challengeError } = await supabaseServer
      .from('challenge_completion')
      .update({ completed: false })
      .eq('user_id', userId);
    if (questError || challengeError) {
      return NextResponse.json({ error: 'Failed to reset quests or challenges', questError, challengeError }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 });
  }
} 