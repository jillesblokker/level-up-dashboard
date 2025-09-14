import { NextResponse } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';
import { supabaseServer } from '../../../../lib/supabase/server-client';
import { grantReward } from '../../kingdom/grantReward';

// Create a new quest completion
export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log('[API/quests/completion] Received body:', data);
    const { questId } = data;
    if (!questId) {
      console.error('[API/quests/completion] Missing questId');
      return NextResponse.json({ error: 'Missing questId' }, { status: 400 });
    }

    const result = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
      console.log('[API/quests/completion] User:', userId, 'QuestId:', questId);
      // Fetch quest to get rewards
      const { data: quest, error: questError } = await supabase
        .from('quests')
        .select('id, xp_reward, gold_reward')
        .eq('id', questId)
        .single();
      
      if (questError || !quest) {
        console.error('[API/quests/completion] Quest not found:', questError);
        throw new Error('Quest not found');
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
        throw smartError;
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
      
      return smartResult;
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('[API/quests/completion] Internal server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Get quest completions for the current user
export async function GET(request: Request) {
  try {
    const result = await authenticatedSupabaseQuery(request, async (supabase, userId) => {

      const { data: questCompletions, error } = await supabase
        .from('quest_completion')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching quest completions:', error);
        throw error;
      }

      return questCompletions;
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error fetching quest completions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    console.log('[QUESTS/COMPLETION][PUT] Request body:', body);
    
    const { questId, completed } = body;
    if (!questId || typeof completed !== 'boolean') {
      console.error('[QUESTS/COMPLETION][PUT] Invalid request data:', { questId, completed });
      return NextResponse.json({ error: 'Missing questId or completed' }, { status: 400 });
    }

    const result = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
    
      console.log('[QUESTS/COMPLETION][PUT] Processing quest completion:', { userId, questId, completed });
      
      // First, fetch the quest to get rewards
      const { data: quest, error: questError } = await supabase
        .from('quests')
        .select('id, xp_reward, gold_reward')
        .eq('id', questId)
        .single();
        
      if (questError || !quest) {
        console.error('[QUESTS/COMPLETION][PUT] Quest not found:', { questError, questId });
        throw new Error('Quest not found');
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
          console.error('[QUESTS/COMPLETION][PUT] Error creating completion record:', completionError);
          throw completionError;
        }
        
        questCompletion = completionData;
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
          throw new Error('No completion record found for today');
        }
        
        const { data: completionData, error: updateError } = await supabase
          .from('quest_completion')
          .update({ completed: false })
          .eq('id', todayCompletion.id)
          .select()
          .single();
        
        if (updateError) {
          console.error('[QUESTS/COMPLETION][PUT] Error updating completion record:', updateError);
          throw updateError;
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
      
      return {
        success: true,
        questCompletion,
        message: completed ? 'Quest completed successfully' : 'Quest marked as incomplete'
      };
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('[QUESTS/COMPLETION][PUT] Internal server error:', error);
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)), details: error }, { status: 500 });
  }
}
