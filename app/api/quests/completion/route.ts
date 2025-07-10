import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '../../../../pages/api/server-client';
import { grantReward } from '../../kingdom/grantReward';

// Create a new quest completion
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      console.error('[API/quests/completion] Unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const data = await request.json();
    console.log('[API/quests/completion] Received body:', data);
    const { questId } = data;
    if (!questId) {
      console.error('[API/quests/completion] Missing questId');
      return NextResponse.json({ error: 'Missing questId' }, { status: 400 });
    }
    console.log('[API/quests/completion] User:', userId, 'QuestId:', questId);
    // Fetch quest to get rewards
    const { data: quest, error: questError } = await supabaseServer
      .from('quests')
      .select('id, xp_reward, gold_reward')
      .eq('id', questId)
      .single();
    if (questError || !quest) {
      console.error('[API/quests/completion] Quest not found:', questError);
      return NextResponse.json({ error: 'Quest not found' }, { status: 404 });
    }
    const { data: questCompletion, error } = await supabaseServer
      .from('quest_completion')
      .upsert([
        {
          user_id: userId,
          quest_id: questId,
          xp_earned: quest.xp_reward,
          gold_earned: quest.gold_reward,
        },
      ], { onConflict: 'user_id,quest_id' })
      .single();
    if (error) {
      console.error('[API/quests/completion] Supabase insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    console.log('[API/quests/completion] Upserted quest_completion:', questCompletion);
    // Log the quest completion event (XP and gold as separate logs)
    await grantReward({
      userId,
      type: 'quest',
      relatedId: questId,
      amount: quest.xp_reward,
      context: { gold: quest.gold_reward }
    });
    await grantReward({
      userId,
      type: 'gold',
      relatedId: questId,
      amount: quest.gold_reward,
      context: { xp: quest.xp_reward }
    });
    return NextResponse.json(questCompletion);
  } catch (error) {
    console.error('[API/quests/completion] Internal server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Get quest completions for the current user
export async function GET(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: questCompletions, error } = await supabaseServer
      .from('quest_completion')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching quest completions:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(questCompletions);
  } catch (error) {
    console.error('Error fetching quest completions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { questId, completed } = await request.json();
    if (!questId || typeof completed !== 'boolean') {
      return NextResponse.json({ error: 'Missing questId or completed' }, { status: 400 });
    }
    const { data, error } = await supabaseServer
      .from('quest_completion')
      .update({ completed })
      .eq('user_id', userId)
      .eq('quest_id', questId)
      .single();
    if (error) {
      console.error('[QUESTS/COMPLETION][PUT] Supabase error:', error, { userId, questId, completed });
      return NextResponse.json({ error: error.message, details: error }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error('[QUESTS/COMPLETION][PUT] Internal server error:', error);
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)), details: error }, { status: 500 });
  }
}
