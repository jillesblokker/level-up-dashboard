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
    console.error(`JWT verification failed: ${e}`, 'Clerk');
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
      console.error('Supabase client not initialized.', 'QUESTS GET');
      return NextResponse.json({ error: 'Supabase client not initialized.' }, { status: 500 });
    }

    // Fetch quests from quests table
    const { data: quests, error: questsError } = await supabase
      .from('quests')
      .select('*');

    if (questsError) {
      console.error(`Quests fetch error: ${questsError.message}`, 'QUESTS GET');
      return NextResponse.json({ error: questsError.message }, { status: 500 });
    }

    // Get user's quest completions from quest_completion table
    const { data: questCompletions, error: completionsError } = await supabase
      .from('quest_completion')
      .select('*')
      .eq('user_id', userId);

    if (completionsError) {
      console.error(`Quest completions fetch error: ${completionsError?.message}`, 'QUESTS GET');
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
    console.error(`Error fetching quests: ${error instanceof Error ? error.stack : error}`, 'QUESTS GET');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Update a quest completion status
export async function PUT(request: Request) {
  console.log(`🚨 ENDPOINT HIT - Method: ${request.method}, URL: ${request.url}`, 'QUESTS-COMPLETE PUT');

  try {
    // Secure Clerk JWT verification
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      console.error('Unauthorized - no valid Clerk JWT', 'QUESTS-COMPLETE PUT');
      return NextResponse.json({ error: 'Unauthorized (Clerk JWT invalid or missing)' }, { status: 401 });
    }

    if (!supabase) {
      console.error('Supabase client not initialized', 'QUESTS-COMPLETE PUT');
      return NextResponse.json({ error: 'Supabase client not initialized.' }, { status: 500 });
    }

    const body = await request.json();
    console.log(`Request body: ${JSON.stringify(body)}`, 'QUESTS-COMPLETE PUT');

    // Quest completion request
    const { title, completed } = body;

    console.log(`Processing quest completion: userId=${userId}, title=${title}, completed=${completed}`, 'QUESTS-COMPLETE PUT');

    // Find the quest by name to get its ID
    const { data: quest, error: questError } = await supabase
      .from('quests')
      .select('id, xp_reward, gold_reward, sender_id')
      .eq('name', title)
      .single();

    // Cast to any to temporarily bypass strict type checking on partial select results
    const diffQuest = quest as any;

    if (questError || !quest) {
      console.error(`Quest not found: ${JSON.stringify({ questError, title })}`, 'QUESTS-COMPLETE PUT');
      return NextResponse.json({ error: 'Quest not found' }, { status: 404 });
    }

    console.log(`Quest found: questId=${quest.id}, title=${title}, xpReward=${quest.xp_reward}, goldReward=${quest.gold_reward}`, 'QUESTS-COMPLETE PUT');

    // 🚀 USE SMART QUEST COMPLETION SYSTEM INSTEAD OF DIRECT TABLE OPERATIONS
    console.log('Using smart quest completion system...', 'QUESTS-COMPLETE PUT');

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
      console.error(`Smart completion error: ${smartError.message}`, 'QUESTS-COMPLETE PUT');
      return NextResponse.json({ error: smartError.message }, { status: 500 });
    }

    console.log(`Smart completion result: ${JSON.stringify(smartResult)}`, 'QUESTS-COMPLETE PUT');

    // Extract completion data from smart result
    const questCompletion = smartResult.record;

    // SOCIAL NOTIFICATION LOGIC:
    // Check if this quest was sent by a friend
    if (completed && diffQuest.sender_id && diffQuest.sender_id !== userId) {
      console.log('Quest was sent by friend, triggering notification...', 'QUESTS-COMPLETE PUT');
      try {
        // Import clerk client dynamically to avoid circular deps if any
        const { clerkClient } = await import('@clerk/nextjs/server');
        const client = await clerkClient();
        const completer = await client.users.getUser(userId);
        const completerName = completer.username || completer.firstName || 'A friend';

        await supabase.from('notifications').insert({
          user_id: diffQuest.sender_id, // Send TO the original sender
          type: 'quest_completed', // Ensure this type is valid in your DB constraint or use a fallback
          data: {
            completerId: userId,
            completerName: completerName,
            questName: title,
            xpEarned: diffQuest.xp_reward || 50
          }
        });
        console.log('Notification sent to sender:', diffQuest.sender_id, 'QUESTS-COMPLETE PUT');
      } catch (notifError) {
        console.error('Error sending social notification:', notifError, 'QUESTS-COMPLETE PUT');
        // Don't fail the request if notification fails
      }
    }

    return NextResponse.json({
      success: true,
      message: `Quest ${completed ? 'completed' : 'uncompleted'} successfully`
    });
  } catch (error) {
    console.error(`Error updating quest completion: ${error instanceof Error ? error.stack : error}`, 'QUESTS-COMPLETE PUT');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Delete a quest (only if owned by user)
export async function DELETE(request: Request) {
  console.log(`🚨 ENDPOINT HIT - Method: ${request.method}, URL: ${request.url}`, 'QUESTS-COMPLETE DELETE');

  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const id = body.id || body.questId;

    if (!id) {
      return NextResponse.json({ error: 'Missing quest ID' }, { status: 400 });
    }

    console.log(`Attempting to delete quest: ${id} for user ${userId}`, 'QUESTS-COMPLETE DELETE');

    // 1. Manually delete associated completions first (avoids FK constraint issues)
    const { error: completionError } = await supabase
      .from('quest_completion')
      .delete()
      .eq('quest_id', id);

    if (completionError) {
      console.warn(`Error deleting quest completions: ${completionError.message}`, 'QUESTS-COMPLETE DELETE');
      // Continue anyway, as we want to delete the quest
    }

    // 2. Delete associated favorites
    const { error: favError } = await supabase
      .from('quest_favorites')
      .delete()
      .eq('quest_id', id);

    if (favError) console.warn(`Error deleting favorites: ${favError.message}`, 'QUESTS-COMPLETE DELETE');

    // 3. Delete associated progress (if table exists)
    const { error: progError } = await supabase
      .from('quest_progress')
      .delete()
      .eq('quest_id', id);

    if (progError) console.warn(`Error deleting progress: ${progError.message}`, 'QUESTS-COMPLETE DELETE');

    // 4. Delete directly from quests table
    // RLS should enforce ownership (user_id = auth.uid())
    // ensuring users can't delete system quests or others' quests
    const { error } = await supabase
      .from('quests')
      .delete()
      .eq('id', id)
      .eq('user_id', userId); // Explicit check for safety

    if (error) {
      console.error(`Error deleting quest: ${error.message}`, 'QUESTS-COMPLETE DELETE');
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error processing delete: ${error}`, 'QUESTS-COMPLETE DELETE');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
