import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { supabaseServer } from '../../../../lib/supabase/server-client';
import { grantReward } from '../../kingdom/grantReward';

const supabase = supabaseServer;

// Helper to extract and verify Clerk JWT, returns userId or null
async function getUserIdFromRequest(request: Request): Promise<string | null> {
  try {
    const { userId } = await getAuth(request as NextRequest);
    console.log('[Quests Completion API] getUserIdFromRequest - Clerk userId:', userId);
    return userId || null;
  } catch (e) {
    console.error('[Clerk] JWT verification failed:', e);
    return null;
  }
}

// Create a new quest completion
export async function POST(request: Request) {
  try {
    // Secure Clerk JWT verification
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized (Clerk JWT invalid or missing)' }, { status: 401 });
    }
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not initialized.' }, { status: 500 });
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
    const { data: quest, error: questError } = await supabase
      .from('quests')
      .select('id, xp_reward, gold_reward')
      .eq('id', questId)
      .single();

    if (questError || !quest) {
      console.error('[API/quests/completion] Quest not found:', questError);
      return NextResponse.json({ error: 'Quest not found' }, { status: 404 });
    }

    // Use smart quest completion system
    const { data: smartResult, error: smartError } = await supabase.rpc('smart_quest_completion', {
      p_user_id: userId,
      p_quest_id: questId,
      p_completed: true,
      p_xp_reward: quest.xp_reward || 50,
      p_gold_reward: quest.gold_reward || 25
    });

    if (smartError) {
      console.error('[API/quests/completion] Smart completion error:', smartError);
      return NextResponse.json({ error: smartError.message }, { status: 500 });
    }

    console.log('[API/quests/completion] Smart completion result:', smartResult);

    // Grant rewards
    if (smartResult && smartResult.record) {
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

        console.log('[API/quests/completion] Rewards granted successfully');
      } catch (rewardError) {
        console.error('[API/quests/completion] Error granting rewards:', rewardError);
        // Don't fail the request if rewards fail
      }
    }

    return NextResponse.json(smartResult);
  } catch (error) {
    console.error('[API/quests/completion] Internal server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Get quest completions for the current user
export async function GET(request: Request) {
  try {
    console.log('[Quests Completion API] GET request received');

    // Secure Clerk JWT verification
    let userId: string | null = null;
    try {
      userId = await getUserIdFromRequest(request);
    } catch (authError) {
      console.error('[Quests Completion API] Auth error:', authError);
      return NextResponse.json({ error: 'Authentication error' }, { status: 401 });
    }

    if (!userId) {
      console.log('[Quests Completion API] No userId found');
      return NextResponse.json({ error: 'Unauthorized (Clerk JWT invalid or missing)' }, { status: 401 });
    }

    console.log('[Quests Completion API] User authenticated:', userId);

    if (!supabase) {
      console.error('[Quests Completion API] Supabase client not initialized');
      return NextResponse.json({ error: 'Supabase client not initialized.' }, { status: 500 });
    }

    const { data: questCompletions, error } = await supabase
      .from('quest_completion')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });

    if (error) {
      console.error('[Quests Completion API] Error fetching quest completions:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('[Quests Completion API] Found', questCompletions?.length || 0, 'completions');
    return NextResponse.json(questCompletions || []);
  } catch (error) {
    console.error('[Quests Completion API] Internal server error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    // Secure Clerk JWT verification
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized (Clerk JWT invalid or missing)' }, { status: 401 });
    }
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not initialized.' }, { status: 500 });
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
    const { data: quest, error: questError } = await supabase
      .from('quests')
      .select('id, xp_reward, gold_reward')
      .eq('id', questId)
      .single();

    if (questError || !quest) {
      console.error('[QUESTS/COMPLETION][PUT] Quest not found:', { questError, questId });
      return NextResponse.json({ error: 'Quest not found' }, { status: 404 });
    }

    console.log('[QUESTS/COMPLETION][PUT] Quest found:', { questId, xpReward: quest.xp_reward, goldReward: quest.gold_reward });
    console.log('[QUESTS/COMPLETION][PUT] Quest ID type:', typeof questId, 'Length:', questId?.length, 'Format:', questId);

    // 🚀 DAILY HABIT TRACKING SYSTEM - Create new completion record for today
    console.log('[QUESTS/COMPLETION][PUT] Using daily habit tracking system...');

    // Use Netherlands timezone (Europe/Amsterdam) for quest completion
    const now = new Date();
    // Use Intl.DateTimeFormat for reliable timezone conversion
    const netherlandsDate = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Amsterdam',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(now);
    const today = netherlandsDate; // Format: YYYY-MM-DD
    let questCompletion: any;

    if (completed) {
      // Quest is being completed - create new completion record for today
      const { data: completionData, error: completionError } = await supabase
        .from('quest_completion')
        .insert({
          user_id: userId,
          quest_id: questId,
          completed: true,
          completed_at: new Date().toISOString(),
          xp_earned: quest.xp_reward || 50,
          gold_earned: quest.gold_reward || 25
        })
        .select()
        .single();

      if (completionError) {
        // If duplicate key error, fetch existing record instead of failing
        if (completionError.code === '23505') { // Postgres duplicate key error code
          console.log('[QUESTS/COMPLETION][PUT] Duplicate completion detected, fetching existing record...');
          const { data: existingData, error: existingError } = await supabase
            .from('quest_completion')
            .select('*')
            .eq('user_id', userId)
            .eq('quest_id', questId)
            .gte('completed_at', `${today}T00:00:00.000Z`)
            .lt('completed_at', `${today}T23:59:59.999Z`)
            .single();

          if (existingError || !existingData) {
            console.error('[QUESTS/COMPLETION][PUT] Failed to fetch existing duplicate:', existingError);
            return NextResponse.json({ error: completionError.message }, { status: 409 });
          }
          questCompletion = existingData;
        } else {
          console.error('[QUESTS/COMPLETION][PUT] Error creating completion record:', completionError);
          return NextResponse.json({ error: completionError.message }, { status: 500 });
        }
      } else {
        questCompletion = completionData;
      }
      console.log('[QUESTS/COMPLETION][PUT] New completion record created:', questCompletion);
    } else {
      // Quest is being unchecked - find today's completion record and set to false
      const { data: todayCompletion, error: fetchError } = await supabase
        .from('quest_completion')
        .select('id')
        .eq('user_id', userId)
        .eq('quest_id', questId)
        .gte('completed_at', `${today}T00:00:00.000Z`)
        .lt('completed_at', `${today}T23:59:59.999Z`)
        .single();

      if (fetchError || !todayCompletion) {
        console.error('[QUESTS/COMPLETION][PUT] No completion record found for today:', fetchError);
        return NextResponse.json({ error: 'No completion record found for today' }, { status: 404 });
      }

      const { data: completionData, error: updateError } = await supabase
        .from('quest_completion')
        .update({ completed: false })
        .eq('id', todayCompletion.id)
        .select()
        .single();

      if (updateError) {
        console.error('[QUESTS/COMPLETION][PUT] Error updating completion record:', updateError);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      questCompletion = completionData;
      console.log('[QUESTS/COMPLETION][PUT] Completion record updated:', questCompletion);
    }

    // If quest is completed, grant rewards
    if (completed) {
      try {
        // Grant XP reward
        if (quest.xp_reward && quest.xp_reward > 0) {
          await grantReward({
            userId,
            type: 'exp',
            relatedId: questId,
            amount: quest.xp_reward,
            context: { source: 'quest-completion' }
          });
        }

        // Grant gold reward
        if (quest.gold_reward && quest.gold_reward > 0) {
          await grantReward({
            userId,
            type: 'gold',
            relatedId: questId,
            amount: quest.gold_reward,
            context: { source: 'quest-completion' }
          });
        }
      } catch (rewardError) {
        console.error('[QUESTS/COMPLETION][PUT] Error granting rewards:', rewardError);
        // Don't fail the quest completion if rewards fail
      }
    }

    return NextResponse.json({
      success: true,
      questCompletion,
      message: completed ? 'Quest completed successfully' : 'Quest marked as incomplete'
    });
  } catch (error) {
    console.error('[QUESTS/COMPLETION][PUT] Internal server error:', error);
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)), details: error }, { status: 500 });
  }
}
