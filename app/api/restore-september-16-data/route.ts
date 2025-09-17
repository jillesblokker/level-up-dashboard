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

    // Insert completion records
    const completionRecords = questsToRestore.map(quest => ({
      user_id: userId,
      quest_id: quest.id,
      completed: true,
      completed_at: '2025-09-16T12:00:00.000Z', // Netherlands timezone
      original_completion_date: '2025-09-16T12:00:00.000Z',
      xp_earned: quest.xp_reward || 50,
      gold_earned: quest.gold_reward || 25
    }));

    const { data: insertData, error: insertError } = await supabaseServer
      .from('quest_completion')
      .insert(completionRecords)
      .select();

    if (insertError) {
      console.error('[Restore September 16 Data] Error inserting completion records:', insertError);
      return NextResponse.json({ error: 'Failed to insert completion records' }, { status: 500 });
    }

    console.log('[Restore September 16 Data] Successfully restored:', insertData?.length || 0, 'completion records');

    // Calculate total rewards
    const totalXP = completionRecords.reduce((sum, record) => sum + record.xp_earned, 0);
    const totalGold = completionRecords.reduce((sum, record) => sum + record.gold_earned, 0);

    return NextResponse.json({ 
      success: true,
      message: `Successfully restored ${insertData?.length || 0} quest completion records for September 16th, 2025`,
      restored: insertData?.length || 0,
      totalXP,
      totalGold,
      restoredQuests: questsToRestore.map(q => q.name)
    });

  } catch (error) {
    console.error('[Restore September 16 Data] Internal server error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 });
  }
}
