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

    // Check existing completion records for ANY date (not just Sep 16)
    const { data: existingCompletions, error: existingError } = await supabaseServer
      .from('quest_completion')
      .select('quest_id, completed_at')
      .eq('user_id', userId)
      .eq('completed', true);

    if (existingError) {
      console.error('[Restore September 16 Data] Error checking existing completions:', existingError);
      return NextResponse.json({ error: 'Failed to check existing completions' }, { status: 500 });
    }

    const existingQuestIds = existingCompletions?.map(c => c.quest_id) || [];
    console.log('[Restore September 16 Data] Existing completions (any date):', existingQuestIds.length);

    // Separate quests into those that need new records vs those that need updates
    const questsToInsert = favoritedQuests.filter(q => !existingQuestIds.includes(q.id));
    const questsToUpdate = favoritedQuests.filter(q => existingQuestIds.includes(q.id));
    
    console.log('[Restore September 16 Data] Quests to insert:', questsToInsert.length);
    console.log('[Restore September 16 Data] Quests to update:', questsToUpdate.length);

    if (questsToInsert.length === 0 && questsToUpdate.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No favorited quests found to restore',
        restored: 0
      });
    }

    // Process quests one by one to handle individual errors
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // First, handle quests that need new records (insert)
    for (const quest of questsToInsert) {
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
          console.log(`[Restore September 16 Data] Successfully inserted quest: ${quest.name}`);
          successCount++;
        }
      } catch (error) {
        console.error(`[Restore September 16 Data] Exception for quest ${quest.name}:`, error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push({ quest: quest.name, error: errorMessage });
        errorCount++;
      }
    }

    // Then, handle quests that need updates (update existing records)
    for (const quest of questsToUpdate) {
      try {
        const { data: updateData, error: updateError } = await supabaseServer
          .from('quest_completion')
          .update({
            completed_at: '2025-09-16T12:00:00.000Z', // Netherlands timezone
            original_completion_date: '2025-09-16T12:00:00.000Z',
            xp_earned: quest.xp_reward || 50,
            gold_earned: quest.gold_reward || 25
          })
          .eq('user_id', userId)
          .eq('quest_id', quest.id)
          .eq('completed', true)
          .select();

        if (updateError) {
          console.error(`[Restore September 16 Data] Error updating quest ${quest.name}:`, updateError);
          errors.push({ quest: quest.name, error: updateError.message });
          errorCount++;
        } else {
          console.log(`[Restore September 16 Data] Successfully updated quest: ${quest.name}`);
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

    // Calculate total rewards for all favorited quests (both inserted and updated)
    const totalXP = favoritedQuests.reduce((sum, quest) => sum + (quest.xp_reward || 50), 0);
    const totalGold = favoritedQuests.reduce((sum, quest) => sum + (quest.gold_reward || 25), 0);

    if (successCount > 0) {
      return NextResponse.json({ 
        success: true,
        message: `Successfully restored ${successCount} quest completion records for September 16th, 2025`,
        restored: successCount,
        totalXP,
        totalGold,
        restoredQuests: favoritedQuests.map(q => q.name),
        inserted: questsToInsert.length,
        updated: questsToUpdate.length,
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
