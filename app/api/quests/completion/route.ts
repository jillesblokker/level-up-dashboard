import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '../../../../lib/supabase/server-client';
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
    
    const body = await request.json();
    console.log('[QUESTS/COMPLETION][PUT] Request body:', body);
    
    const { questId, completed } = body;
    if (!questId || typeof completed !== 'boolean') {
      console.error('[QUESTS/COMPLETION][PUT] Invalid request data:', { questId, completed });
      return NextResponse.json({ error: 'Missing questId or completed' }, { status: 400 });
    }
    
    console.log('[QUESTS/COMPLETION][PUT] Processing quest completion:', { userId, questId, completed });
    
    // First, fetch the quest to get rewards
    const { data: quest, error: questError } = await supabaseServer
      .from('quests')
      .select('id, xp_reward, gold_reward')
      .eq('id', questId)
      .single();
      
    if (questError || !quest) {
      console.error('[QUESTS/COMPLETION][PUT] Quest not found:', { questError, questId });
      return NextResponse.json({ error: 'Quest not found' }, { status: 404 });
    }
    
    console.log('[QUESTS/COMPLETION][PUT] Quest found:', { questId, xpReward: quest.xp_reward, goldReward: quest.gold_reward });
    
    // 🚀 USE SMART QUEST COMPLETION SYSTEM INSTEAD OF DIRECT TABLE OPERATIONS
    console.log('[QUESTS/COMPLETION][PUT] Using smart quest completion system...');
    
    // Call the smart completion function
    // Ensure questId is properly cast to UUID type
    const { data: smartResult, error: smartError } = await supabaseServer.rpc('smart_quest_completion', {
      p_user_id: userId,
      p_quest_id: questId as any, // Cast to any to avoid UUID type issues
      p_completed: completed,
      p_xp_reward: quest.xp_reward || 50,
      p_gold_reward: quest.gold_reward || 25
    });
    
    if (smartError) {
      console.error('[QUESTS/COMPLETION][PUT] Smart completion error:', smartError);
      return NextResponse.json({ error: smartError.message }, { status: 500 });
    }
    
    console.log('[QUESTS/COMPLETION][PUT] Smart completion result:', smartResult);
    
    // Extract completion data from smart result
    const questCompletion = smartResult.record;
    
    // If quest is completed, grant rewards
    if (completed && questCompletion) {
      console.log('[QUESTS/COMPLETION][PUT] Granting rewards for completed quest');
      try {
        await grantReward({
          userId,
          type: 'quest',
          relatedId: questId,
          amount: quest.xp_reward || 50,
          context: { gold: quest.gold_reward || 25 }
        });
        
        await grantReward({
          userId,
          type: 'gold',
          relatedId: questId,
          amount: quest.gold_reward || 25,
          context: { xp: quest.xp_reward || 50 }
        });
        
        console.log('[QUESTS/COMPLETION][PUT] Rewards granted successfully');
      } catch (rewardError) {
        console.error('[QUESTS/COMPLETION][PUT] Error granting rewards:', rewardError);
        // Don't fail the request if rewards fail
      }
    }
    
    console.log('[QUESTS/COMPLETION][PUT] Final completion record:', questCompletion);
    return NextResponse.json(questCompletion);
  } catch (error) {
    console.error('[QUESTS/COMPLETION][PUT] Internal server error:', error);
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)), details: error }, { status: 500 });
  }
}
