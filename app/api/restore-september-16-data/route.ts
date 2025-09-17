import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server-client';

export async function POST(request: NextRequest) {
  try {
    console.log('[Restore September 16 Data] Starting restoration process');
    
    const { userId } = await auth();
    if (!userId) {
      console.error('[Restore September 16 Data] Unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Restore September 16 Data] Authenticated user:', userId);
    
    // First, get user's favorited quest IDs from quest_favorites table
    const { data: favoriteData, error: favoriteError } = await supabaseServer
      .from('quest_favorites')
      .select('quest_id')
      .eq('user_id', userId);

    if (favoriteError) {
      console.error('[Restore September 16 Data] Error fetching favorited quests:', favoriteError);
      return NextResponse.json({ error: 'Failed to fetch favorited quests' }, { status: 500 });
    }

    const favoritedQuestIds = favoriteData?.map(item => item.quest_id) || [];
    console.log('[Restore September 16 Data] Found favorited quest IDs:', favoritedQuestIds);

    if (favoritedQuestIds.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No favorited quests found to restore',
        restored: 0
      });
    }

    // Now fetch the actual quest details for these favorited quests
    const { data: favoritedQuests, error: questError } = await supabaseServer
      .from('quests')
      .select('id, name, category, xp_reward, gold_reward')
      .in('id', favoritedQuestIds);

    console.log('[Restore September 16 Data] Fetched quest details:', favoritedQuests?.length || 0, 'quests');
    if (favoritedQuests && favoritedQuests.length > 0) {
      console.log('[Restore September 16 Data] Sample quest data:', favoritedQuests[0]);
    }

    if (questError) {
      console.error('[Restore September 16 Data] Error fetching favorited quests:', questError);
      return NextResponse.json({ error: 'Failed to fetch favorited quests' }, { status: 500 });
    }

    console.log('[Restore September 16 Data] Found favorited quests:', favoritedQuests?.length || 0);

    if (!favoritedQuests || favoritedQuests.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No favorited quests found to restore',
        restored: 0
      });
    }

    // Check existing completion records for September 16th
    const { data: existingCompletions, error: existingError } = await supabaseServer
      .from('quest_completion')
      .select('quest_id')
      .eq('user_id', userId)
      .gte('completed_at', '2025-09-16T00:00:00.000Z')
      .lt('completed_at', '2025-09-17T00:00:00.000Z');

    if (existingError) {
      console.error('[Restore September 16 Data] Error checking existing completions:', existingError);
      return NextResponse.json({ error: 'Failed to check existing completions' }, { status: 500 });
    }

    const existingQuestIds = existingCompletions?.map(c => c.quest_id) || [];
    console.log('[Restore September 16 Data] Existing completions for Sep 16:', existingQuestIds.length);

    // Create completion records for quests that don't already have them
    const questsToRestore = favoritedQuests.filter(q => !existingQuestIds.includes(q.id));
    console.log('[Restore September 16 Data] Quests to restore:', questsToRestore.length);

    if (questsToRestore.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'All favorited quests already have completion records for September 16th',
        restored: 0
      });
    }

    // Insert completion records one by one to handle individual errors
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const quest of questsToRestore) {
      try {
        const completionRecord = {
          user_id: userId,
          quest_id: quest.id,
          completed: true,
          completed_at: '2025-09-16T12:00:00.000Z', // Netherlands timezone
          original_completion_date: '2025-09-16T12:00:00.000Z',
          xp_earned: quest.xp_reward || 50,
          gold_earned: quest.gold_reward || 25
        };

        const { data: insertData, error: insertError } = await supabaseServer
          .from('quest_completion')
          .insert(completionRecord)
          .select();

        if (insertError) {
          console.error(`[Restore September 16 Data] Error inserting quest ${quest.name}:`, insertError);
          errors.push({ quest: quest.name, error: insertError.message });
          errorCount++;
        } else {
          console.log(`[Restore September 16 Data] Successfully restored quest: ${quest.name}`);
          successCount++;
        }
      } catch (error) {
        console.error(`[Restore September 16 Data] Exception for quest ${quest.name}:`, error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push({ quest: quest.name, error: errorMessage });
        errorCount++;
      }
    }

    console.log(`[Restore September 16 Data] Restoration complete: ${successCount} successful, ${errorCount} errors`);

    // Calculate total rewards for successfully restored quests
    const totalXP = questsToRestore.slice(0, successCount).reduce((sum, quest) => sum + (quest.xp_reward || 50), 0);
    const totalGold = questsToRestore.slice(0, successCount).reduce((sum, quest) => sum + (quest.gold_reward || 25), 0);

    if (successCount > 0) {
      return NextResponse.json({ 
        success: true,
        message: `Successfully restored ${successCount} quest completion records for September 16th, 2025`,
        restored: successCount,
        totalXP,
        totalGold,
        restoredQuests: questsToRestore.slice(0, successCount).map(q => q.name),
        errors: errors.length > 0 ? errors : undefined
      });
    } else {
      return NextResponse.json({ 
        success: false,
        message: 'Failed to restore any quest completion records',
        restored: 0,
        errors: errors
      }, { status: 500 });
    }

  } catch (error) {
    console.error('[Restore September 16 Data] Internal server error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 });
  }
}
