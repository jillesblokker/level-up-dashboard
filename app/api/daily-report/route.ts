import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  try {
    const result = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
      // Calculate yesterday's boundaries in UTC/ISO strings
      const now = new Date();
      
      const yesterdayStart = new Date(now);
      yesterdayStart.setDate(now.getDate() - 1);
      yesterdayStart.setHours(0, 0, 0, 0);
      
      const yesterdayEnd = new Date(now);
      yesterdayEnd.setDate(now.getDate() - 1);
      yesterdayEnd.setHours(23, 59, 59, 999);

      const yesterdayStartISO = yesterdayStart.toISOString();
      const yesterdayEndISO = yesterdayEnd.toISOString();

      // Query quest completions yesterday
      const { data: completions, error: completionsError } = await supabase
        .from('quest_completion')
        .select('xp_earned, gold_earned, quest_id')
        .eq('user_id', userId)
        .eq('completed', true)
        .gte('completed_at', yesterdayStartISO)
        .lte('completed_at', yesterdayEndISO);

      if (completionsError) {
        throw completionsError;
      }

      // Sum up rewards
      let completedQuestsCount = completions?.length || 0;
      let goldEarned = 0;
      let xpEarned = 0;

      if (completions) {
        completions.forEach(c => {
          goldEarned += Number(c.gold_earned || 0);
          xpEarned += Number(c.xp_earned || 0);
        });
      }

      // Get quest details to map categories
      const questIds = completions?.map(c => c.quest_id).filter(id => id && UUID_REGEX.test(id)) || [];
      let questCategoryMap: Record<string, string> = {};
      
      if (questIds.length > 0) {
        const { data: quests } = await supabase
          .from('quests')
          .select('id, category')
          .in('id', questIds);
          
        if (quests) {
          quests.forEach(q => {
            questCategoryMap[q.id] = q.category || 'might';
          });
        }
      }

      // Count completions per category
      const categoryCounts: Record<string, number> = { might: 0, knowledge: 0, honor: 0, wealth: 0, heart: 0 };
      if (completions) {
        completions.forEach(c => {
          const category = questCategoryMap[c.quest_id] || 'might';
          categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        });
      }

      // Determine primary archetype
      let maxCount = -1;
      let primaryCategory = 'might';
      Object.entries(categoryCounts).forEach(([cat, count]) => {
        if (count > maxCount) {
          maxCount = count;
          primaryCategory = cat;
        }
      });

      const archetypeNames: Record<string, string> = {
        might: 'Gladiator',
        knowledge: 'Grand Mage',
        honor: 'Paladin',
        wealth: 'Merchant Lord',
        heart: 'Cleric'
      };
      
      const archetype = completedQuestsCount > 0 ? (archetypeNames[primaryCategory] || 'Gladiator') : 'Adventurer';

      // Query achievements unlocked yesterday
      let milestonesUnlocked = 0;
      try {
        const { data: achievements, error: achievementsError } = await supabase
          .from('achievements')
          .select('id')
          .eq('user_id', userId)
          .gte('created_at', yesterdayStartISO)
          .lte('created_at', yesterdayEndISO);

        if (!achievementsError && achievements) {
          milestonesUnlocked = achievements.length;
        }
      } catch (err) {
        logger.warn('[Daily Report API] Failed to fetch yesterday achievements (ignoring):', err);
      }

      return {
        completedQuestsCount,
        goldEarned,
        xpEarned,
        milestonesUnlocked,
        archetype,
        categoryCounts
      };
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(result.data);
  } catch (error: any) {
    logger.error('[Daily Report API] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
