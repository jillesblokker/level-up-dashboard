import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { supabaseServer } from '../../../lib/supabase/server-client';

const supabase = supabaseServer;

// Helper to extract and verify Clerk JWT, returns userId or null
async function getUserIdFromRequest(request: Request): Promise<string | null> {
  try {
    const { userId } = getAuth(request as NextRequest);
    return userId || null;
  } catch (e) {
    console.error('[Clerk] JWT verification failed:', e);
    return null;
  }
}

export async function GET(request: Request) {
  try {
    // Secure Clerk JWT verification
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized (Clerk JWT invalid or missing)' }, { status: 401 });
    }
    
    if (!supabase) {
      console.error('[QUESTS][GET] Supabase client not initialized.');
      return NextResponse.json({ error: 'Supabase client not initialized.' }, { status: 500 });
    }

    // Fetch quests from quests table
    const { data: quests, error: questsError } = await supabase
      .from('quests')
      .select('*');

    if (questsError) {
      console.error('Quests fetch error:', questsError);
      return NextResponse.json({ error: questsError.message }, { status: 500 });
    }

    // Get user's quest completions from quest_completion table
    const { data: questCompletions, error: completionsError } = await supabase
      .from('quest_completion')
      .select('*')
      .eq('user_id', userId);

    if (completionsError) {
      console.error('Quest completions fetch error:', completionsError);
      // If the table doesn't exist, continue with empty completions
    }

    // Create a map of quest completions (only treat as completed if completed === true)
    const completedQuests = new Map();
    if (questCompletions) {
      questCompletions.forEach((completion: any) => {
        completedQuests.set(completion.quest_id, completion);
      });
    }

    // Convert quests data to quest format
    const questsWithCompletions = (quests || []).map((quest: any) => {
      const completion = completedQuests.get(quest.id);
      const isCompleted = completion?.completed === true;
      
      return {
        id: quest.id,
        name: quest.name,
        title: quest.title,
        description: quest.description,
        category: quest.category,
        difficulty: quest.difficulty,
        xp: quest.xp_reward || quest.xp,
        gold: quest.gold_reward || quest.gold,
        completed: isCompleted,
        date: completion?.completed_at || null,
        isNew: !isCompleted,
        completionId: completion?.id
      };
    });

    return NextResponse.json(questsWithCompletions);
  } catch (error) {
    console.error('Error fetching quests:', error instanceof Error ? error.stack : error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Update a quest completion status
export async function PUT(request: Request) {
  console.log('[QUESTS-COMPLETE][PUT] 🚨 ENDPOINT HIT - Method:', request.method, 'URL:', request.url);
  
  try {
    // Secure Clerk JWT verification
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      console.error('[QUESTS-COMPLETE][PUT] Unauthorized - no valid Clerk JWT');
      return NextResponse.json({ error: 'Unauthorized (Clerk JWT invalid or missing)' }, { status: 401 });
    }
    
    if (!supabase) {
      console.error('[QUESTS-COMPLETE][PUT] Supabase client not initialized');
      return NextResponse.json({ error: 'Supabase client not initialized.' }, { status: 500 });
    }

    const body = await request.json();
    console.log('[QUESTS-COMPLETE][PUT] Request body:', body);
    
    // Quest completion request
    const { title, completed } = body;
    
    console.log('[QUESTS-COMPLETE][PUT] Processing quest completion:', { userId, title, completed });
    
    // Find the quest by name to get its ID
    const { data: quest, error: questError } = await supabase
      .from('quests')
      .select('id, xp_reward, gold_reward')
      .eq('name', title)
      .single();

    if (questError || !quest) {
      console.error('[QUESTS-COMPLETE][PUT] Quest not found:', { questError, title });
      return NextResponse.json({ error: 'Quest not found' }, { status: 404 });
    }
    
    console.log('[QUESTS-COMPLETE][PUT] Quest found:', { questId: quest.id, title, xpReward: quest.xp_reward, goldReward: quest.gold_reward });

    // 🚀 USE SMART QUEST COMPLETION SYSTEM INSTEAD OF DIRECT TABLE OPERATIONS
    console.log('[QUESTS-COMPLETE][PUT] Using smart quest completion system...');
    
    // Call the smart completion function
    // Ensure questId is properly cast to UUID type
    const { data: smartResult, error: smartError } = await supabase.rpc('smart_quest_completion', {
      p_user_id: userId,
      p_quest_id: quest.id as any, // Cast to any to avoid UUID type issues
      p_completed: completed,
      p_xp_reward: quest.xp_reward || 50,
      p_gold_reward: quest.gold_reward || 25
    });
    
    if (smartError) {
      console.error('[QUESTS-COMPLETE][PUT] Smart completion error:', smartError);
      return NextResponse.json({ error: smartError.message }, { status: 500 });
    }
    
    console.log('[QUESTS-COMPLETE][PUT] Smart completion result:', smartResult);
    
    // Extract completion data from smart result
    const questCompletion = smartResult.record;

    return NextResponse.json({ 
      success: true, 
      message: `Quest ${completed ? 'completed' : 'uncompleted'} successfully` 
    });
  } catch (error) {
    console.error('[QUESTS-COMPLETE][PUT] Error updating quest completion:', error instanceof Error ? error.stack : error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
