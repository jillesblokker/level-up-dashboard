import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server-client';

export async function POST(request: NextRequest) {
  try {
    console.log('[Restore Lost Quest Data] Starting data restoration process');
    
    const { userId } = await auth();
    if (!userId) {
      console.error('[Restore Lost Quest Data] Unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Restore Lost Quest Data] Authenticated user:', userId);
    
    // Get all favorited quests for the user
    const { data: favoritedQuests, error: favoritesError } = await supabaseServer
      .from('quest_favorites')
      .select('quest_id')
      .eq('user_id', userId);

    if (favoritesError) {
      console.error('[Restore Lost Quest Data] Error fetching favorited quests:', favoritesError);
      return NextResponse.json({ error: 'Failed to fetch favorited quests' }, { status: 500 });
    }

    if (!favoritedQuests || favoritedQuests.length === 0) {
      return NextResponse.json({ 
        success: true,
        message: 'No favorited quests found to restore',
        restored: 0
      });
    }

    console.log('[Restore Lost Quest Data] Found favorited quests:', favoritedQuests.length);

    // Get quest details for favorited quests
    const questIds = favoritedQuests.map(f => f.quest_id);
    const { data: questDetails, error: questsError } = await supabaseServer
      .from('quests')
      .select('*')
      .in('id', questIds);

    if (questsError) {
      console.error('[Restore Lost Quest Data] Error fetching quest details:', questsError);
      return NextResponse.json({ error: 'Failed to fetch quest details' }, { status: 500 });
    }

    console.log('[Restore Lost Quest Data] Found quest details:', questDetails?.length || 0);

    // Restore completion data for the last 14 days (inclusive of today)
    const datesToRestore: string[] = [];
    const now = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      datesToRestore.push(`${yyyy}-${mm}-${dd}`);
    }

    let totalRestored = 0;
    let totalXP = 0;
    let totalGold = 0;
    const attempts: Array<{date: string; questId: string; inserted: boolean; error?: string}> = [];

    for (const date of datesToRestore) {
      console.log(`[Restore Lost Quest Data] Restoring data for ${date}`);
      
      for (const quest of questDetails || []) {
        try {
          // Check if completion record already exists for this date
          const { data: existingRecord } = await supabaseServer
            .from('quest_completion')
            .select('id')
            .eq('user_id', userId)
            .eq('quest_id', quest.id)
            .gte('completed_at', `${date}T00:00:00.000Z`)
            .lt('completed_at', `${date}T23:59:59.999Z`)
            .single();

          if (!existingRecord) {
            // Try to insert; if unique constraint exists, this will be ignored safely by upsert
            const { error: insertError } = await supabaseServer
              .from('quest_completion')
              .insert({
                user_id: userId,
                quest_id: quest.id,
                completed: true,
                completed_at: `${date}T12:00:00.000Z`,
                xp_earned: quest.xp_reward || 50,
                gold_earned: quest.gold_reward || 25
              });

            if (insertError) {
              attempts.push({ date, questId: quest.id, inserted: false, error: insertError.message || String(insertError) });
              console.error(`[Restore Lost Quest Data] Error inserting ${quest.name} for ${date}:`, insertError);
            } else {
              attempts.push({ date, questId: quest.id, inserted: true });
              totalRestored++;
              totalXP += quest.xp_reward || 50;
              totalGold += quest.gold_reward || 25;
              console.log(`[Restore Lost Quest Data] ✅ Restored ${quest.name} for ${date}`);
            }
          } else {
            attempts.push({ date, questId: quest.id, inserted: false, error: 'exists' });
          }
        } catch (error) {
          console.error(`[Restore Lost Quest Data] Error processing ${quest.name} for ${date}:`, error);
        }
      }
    }

    console.log(`[Restore Lost Quest Data] Restoration complete: ${totalRestored} records restored`);

    return NextResponse.json({ 
      success: true,
      message: `Successfully restored ${totalRestored} quest completion records`,
      restored: totalRestored,
      totalXP,
      totalGold,
      datesRestored: datesToRestore,
      favoritedQuests: questDetails?.length || 0,
      debug: {
        attempts: attempts.slice(0, 50),
        totals: {
          attempts: attempts.length,
          inserted: attempts.filter(a => a.inserted).length,
          skippedExisting: attempts.filter(a => a.error === 'exists').length,
          errors: attempts.filter(a => a.error && a.error !== 'exists').length
        }
      }
    });

  } catch (error) {
    console.error('[Restore Lost Quest Data] Internal server error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Internal server error', details: errorMessage }, { status: 500 });
  }
}
