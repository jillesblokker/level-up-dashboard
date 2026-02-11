import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { supabaseServer } from '../../../lib/supabase/server-client';
import { apiLogger } from '@/lib/logger';
import type { DbQuestRow, DbQuestCompletionRow } from '@/types/api';

const supabase = supabaseServer;

// Helper to extract and verify Clerk JWT, returns userId or null
async function getUserIdFromRequest(request: Request): Promise<string | null> {
  try {
    const { userId } = getAuth(request as NextRequest);
    return userId || null;
  } catch (e) {
    apiLogger.error('JWT verification failed:', e);
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
      apiLogger.error('Supabase client not initialized');
      return NextResponse.json({ error: 'Supabase client not initialized.' }, { status: 500 });
    }

    // Fetch quests from quests table
    const { data: quests, error: questsError } = await supabase
      .from('quests')
      .select('*');

    if (questsError) {
      apiLogger.error('Quests fetch error:', questsError.message);
      return NextResponse.json({ error: questsError.message }, { status: 500 });
    }

    // Get user's quest completions from quest_completion table
    const { data: questCompletions, error: completionsError } = await supabase
      .from('quest_completion')
      .select('*')
      .eq('user_id', userId);

    if (completionsError) {
      apiLogger.warn('Quest completions fetch error:', completionsError?.message);
      // If the table doesn't exist, continue with empty completions
    }

    // Create a map of quest completions (only treat as completed if completed === true)
    const completedQuests = new Map<string, DbQuestCompletionRow>();
    if (questCompletions) {
      (questCompletions as DbQuestCompletionRow[]).forEach((completion) => {
        completedQuests.set(completion.quest_id, completion);
      });
    }

    // Convert quests data to quest format
    const questsWithCompletions = ((quests || []) as DbQuestRow[]).map((quest) => {
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
    apiLogger.error('Error fetching quests:', error);
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
      apiLogger.error('Supabase client not initialized');
      return NextResponse.json({ error: 'Supabase client not initialized.' }, { status: 500 });
    }

    const body = await request.json();

    // Quest completion request
    const { title, completed } = body;

    apiLogger.debug(`Processing quest completion: title=${title}, completed=${completed}`);

    // Find the quest by name to get its ID
    const { data: quest, error: questError } = await supabase
      .from('quests')
      .select('id, xp_reward, gold_reward, sender_id')
      .eq('name', title)
      .single();

    if (questError || !quest) {
      apiLogger.warn(`Quest not found: ${title}`);
      return NextResponse.json({ error: 'Quest not found' }, { status: 404 });
    }

    // Use smart quest completion system
    const { data: smartResult, error: smartError } = await supabase.rpc('smart_quest_completion', {
      p_user_id: userId,
      p_quest_id: quest.id,
      p_completed: completed,
      p_xp_reward: quest.xp_reward || 50,
      p_gold_reward: quest.gold_reward || 25
    });

    if (smartError) {
      apiLogger.error('Smart completion error:', smartError.message);
      return NextResponse.json({ error: smartError.message }, { status: 500 });
    }

    apiLogger.debug('Smart completion successful');

    // --- Productivity Milestones & Encouraging Messages ---
    let milestoneMessage = null;
    if (completed) {
      try {
        const today = new Date().toISOString().split('T')[0];

        // 1. Check Today's Quest Count
        const { count: questsToday } = await supabase
          .from('quest_completion')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('completed', true)
          .gte('completed_at', `${today}T00:00:00`)
          .lte('completed_at', `${today}T23:59:59`);

        // 2. Check Streak
        const { data: charStats } = await supabase
          .from('character_stats')
          .select('streak_days')
          .eq('user_id', userId)
          .single();

        const { getMilestoneMessage } = await import('@/lib/encouraging-messages');

        // Priority to streak milestones if they align, otherwise quest counts
        if (charStats?.streak_days === 7) {
          milestoneMessage = getMilestoneMessage('streak_7');
        } else if (charStats?.streak_days === 3) {
          milestoneMessage = getMilestoneMessage('streak_3');
        } else if (questsToday === 10) {
          milestoneMessage = getMilestoneMessage('quests_10');
        } else if (questsToday === 5) {
          milestoneMessage = getMilestoneMessage('quests_5');
        } else if (questsToday === 3) {
          milestoneMessage = getMilestoneMessage('quests_3');
        }
      } catch (err) {
        apiLogger.warn('Error checking milestones:', err);
      }
    }
    // --- End Milestones ---

    // SOCIAL NOTIFICATION LOGIC:
    // Check if this quest was sent by a friend
    if (completed && quest.sender_id && quest.sender_id !== userId) {
      apiLogger.debug('Quest was sent by friend, triggering notification');
      try {
        const { clerkClient } = await import('@clerk/nextjs/server');
        const client = await clerkClient();
        const completer = await client.users.getUser(userId);
        const completerName = completer.username || completer.firstName || 'A friend';

        await supabase.from('notifications').insert({
          user_id: quest.sender_id,
          type: 'quest_completed',
          data: {
            completerId: userId,
            completerName: completerName,
            questName: title,
            xpEarned: quest.xp_reward || 50
          }
        });
        apiLogger.debug(`Notification sent to sender: ${quest.sender_id}`);
      } catch (notifError) {
        apiLogger.warn('Error sending social notification:', notifError);
        // Don't fail the request if notification fails
      }
    }

    return NextResponse.json({
      success: true,
      message: `Quest ${completed ? 'completed' : 'uncompleted'} successfully`,
      milestoneMessage: milestoneMessage
    });
  } catch (error) {
    apiLogger.error('Error updating quest completion:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Delete a quest (only if owned by user)
export async function DELETE(request: Request) {
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

    apiLogger.debug(`Attempting to delete quest: ${id}`);

    // 1. Manually delete associated completions first (avoids FK constraint issues)
    const { error: completionError } = await supabase
      .from('quest_completion')
      .delete()
      .eq('quest_id', id);

    if (completionError) {
      apiLogger.warn('Error deleting quest completions:', completionError.message);
    }

    // 2. Delete associated favorites
    const { error: favError } = await supabase
      .from('quest_favorites')
      .delete()
      .eq('quest_id', id);

    if (favError) {
      apiLogger.warn('Error deleting favorites:', favError.message);
    }

    // 3. Delete associated progress (if table exists)
    const { error: progError } = await supabase
      .from('quest_progress')
      .delete()
      .eq('quest_id', id);

    if (progError) {
      apiLogger.warn('Error deleting progress:', progError.message);
    }

    // 4. Delete directly from quests table
    const { error } = await supabase
      .from('quests')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      apiLogger.error('Error deleting quest:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    apiLogger.error('Error processing delete:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
