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
    console.log('Fetching quests from quests table...');
    const { data: quests, error: questsError } = await supabase
      .from('quests')
      .select('*');

    if (questsError) {
      console.error('Quests fetch error:', questsError);
      return NextResponse.json({ error: questsError.message }, { status: 500 });
    }

    // Get user's quest completions from quest_completion table
    console.log('Fetching user quest completions...');
    const { data: questCompletions, error: completionsError } = await supabase
      .from('quest_completion')
      .select('*')
      .eq('user_id', userId);

    if (completionsError) {
      console.error('Quest completions fetch error:', completionsError);
      // If the table doesn't exist, continue with empty completions
      console.log('quest_completion table error, continuing with empty completions');
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

    console.log(`Returning ${questsWithCompletions.length} quests`);
    return NextResponse.json(questsWithCompletions);
  } catch (error) {
    console.error('Error fetching quests:', error instanceof Error ? error.stack : error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Update a quest completion status
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
    console.log('Quest completion request:', body);
    
    const { title, completed } = body;
    
    // Find the quest by name to get its ID
    const { data: quest, error: questError } = await supabase
      .from('quests')
      .select('id, xp_reward, gold_reward')
      .eq('name', title)
      .single();

    if (questError || !quest) {
      console.error('Quest not found:', questError);
      return NextResponse.json({ error: 'Quest not found' }, { status: 404 });
    }

    if (completed) {
      // Mark quest as completed
      const { data: questCompletion, error } = await supabase
        .from('quest_completion')
        .upsert([
          {
            user_id: userId,
            quest_id: quest.id,
            completed: true,
            completed_at: new Date().toISOString(),
            xp_earned: quest.xp_reward || 0,
            gold_earned: quest.gold_reward || 0,
          },
        ], { onConflict: 'user_id,quest_id' })
        .single();

      if (error) {
        console.error('Error upserting quest completion:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      console.log('Quest completion upserted:', questCompletion);
    } else {
      // Mark quest as not completed (delete the completion record)
      const { error } = await supabase
        .from('quest_completion')
        .delete()
        .eq('user_id', userId)
        .eq('quest_id', quest.id);

      if (error) {
        console.error('Error deleting quest completion:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      console.log('Quest completion deleted');
    }

    return NextResponse.json({ 
      success: true, 
      message: `Quest ${completed ? 'completed' : 'uncompleted'} successfully` 
    });
  } catch (error) {
    console.error('Error updating quest completion:', error instanceof Error ? error.stack : error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
