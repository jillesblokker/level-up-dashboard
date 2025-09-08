import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '../../../lib/supabase/server-client';

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[DEBUG] User ID:', userId);

    // Get all quest completions for this user
    const { data: completions, error: completionsError } = await supabaseServer
      .from('quest_completion')
      .select('*')
      .eq('user_id', userId);

    if (completionsError) {
      console.error('[DEBUG] Error fetching completions:', completionsError);
      return NextResponse.json({ error: completionsError.message }, { status: 500 });
    }

    console.log('[DEBUG] Found completions:', completions?.length || 0);

    // Get all quests
    const { data: quests, error: questsError } = await supabaseServer
      .from('quests')
      .select('id, name, category')
      .limit(10);

    if (questsError) {
      console.error('[DEBUG] Error fetching quests:', questsError);
      return NextResponse.json({ error: questsError.message }, { status: 500 });
    }

    console.log('[DEBUG] Found quests:', quests?.length || 0);

    // Create completion map like the main API does
    const completedQuests = new Map();
    if (completions) {
      completions.forEach((completion: any) => {
        const isCompleted = completion.completed === true && completion.completed_at !== null;
        console.log('[DEBUG] Processing completion:', {
          quest_id: completion.quest_id,
          completed: completion.completed,
          completed_at: completion.completed_at,
          isCompleted,
          record_exists: true
        });
        
        if (isCompleted) {
          completedQuests.set(completion.quest_id, {
            completed: true,
            completedAt: completion.completed_at,
            xpEarned: completion.xp_earned,
            goldEarned: completion.gold_earned
          });
        }
      });
    }

    // Check which quests have completions
    const questCompletionStatus = quests?.map(quest => {
      const completion = completedQuests.get(quest.id);
      return {
        questId: quest.id,
        questName: quest.name,
        questCategory: quest.category,
        hasCompletion: !!completion,
        isCompleted: completion ? completion.completed : false,
        completionData: completion
      };
    }) || [];

    return NextResponse.json({
      userId,
      totalCompletions: completions?.length || 0,
      totalQuests: quests?.length || 0,
      completedQuestsMap: Array.from(completedQuests.entries()),
      questCompletionStatus,
      rawCompletions: completions,
      rawQuests: quests
    });

  } catch (error) {
    console.error('[DEBUG] Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
