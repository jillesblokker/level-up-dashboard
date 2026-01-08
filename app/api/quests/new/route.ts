import { NextRequest, NextResponse } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';
import { calculateRewards } from '@/lib/game-logic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[API/quests/new] Received body:', body);

    const { name, description, category, difficulty, mandate_period, mandate_count } = body;

    if (!name || !category) {
      console.error('[API/quests/new] Missing required fields:', { name, category });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Calculate rewards based on difficulty
    const rewards = calculateRewards(difficulty || 'medium');
    const xp_reward = rewards.xp;
    const gold_reward = rewards.gold;

    // Use authenticated Supabase query
    const result = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
      const { data, error } = await supabase
        .from('quests')
        .insert([
          {
            name,
            description,
            category,
            difficulty,
            xp_reward,
            gold_reward,
            is_recurring: mandate_period !== 'once',
            mandate_period: mandate_period || 'daily',
            mandate_count: mandate_count || 1,
            user_id: userId,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('[API/quests/new] Supabase insert error:', error);
        throw error;
      }

      return data;
    });

    if (!result.success) {
      console.log('[API/quests/new] Authentication failed');
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    const quest: any = result.data;
    return NextResponse.json({
      id: quest.id,
      name: quest.name,
      description: quest.description,
      category: quest.category,
      difficulty: quest.difficulty,
      xp: quest.xp_reward,
      gold: quest.gold_reward,
    });
  } catch (error: any) {
    console.error('[API/quests/new] Internal server error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}