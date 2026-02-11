
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server-client';
import { defaultStrengths, calculateStrengthFromXp } from '@/lib/strength-manager';

export const dynamic = 'force-dynamic';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch completions
    const { data: completions, error: completionError } = await supabaseServer
      .from('quest_completion')
      .select('quest_id, xp_earned')
      .eq('user_id', userId)
      .eq('completed', true);

    if (completionError) {
      console.error('Error fetching completions:', completionError);
      return NextResponse.json({ error: completionError.message }, { status: 500 });
    }

    if (!completions || completions.length === 0) {
      return NextResponse.json({ strengths: defaultStrengths });
    }

    // 2. Identify Quest IDs to fetch details for
    // Filter only valid UUIDs to prevent PostgreSQL errors when querying 'quests' table
    const validQuestIds = [...new Set(
      completions
        .map((c: any) => c.quest_id)
        .filter((id: any) => typeof id === 'string' && UUID_REGEX.test(id))
    )];

    // Map questId -> category (lowercase)
    const questCategoryMap: Record<string, string> = {};

    if (validQuestIds.length > 0) {
      const { data: quests, error: questError } = await supabaseServer
        .from('quests')
        .select('id, category')
        .in('id', validQuestIds);

      if (questError) {
        console.error('Error fetching quest details:', questError);
        // We continue, treating failed quests as having no category
      } else if (quests) {
        quests.forEach((q: any) => {
          if (q.category) {
            questCategoryMap[q.id] = q.category.toLowerCase();
          }
        });
      }
    }

    // 3. Aggregate XP
    const xpByCategory: Record<string, number> = {};

    completions.forEach((c: any) => {
      const questId = c.quest_id;
      // Lookup category
      const category = questCategoryMap[questId];

      if (category) {
        xpByCategory[category] = (xpByCategory[category] || 0) + (c.xp_earned || 0);
      }
    });

    // 4. Calculate Levels for each Strength
    const strengths = defaultStrengths.map(ds => {
      const totalXp = xpByCategory[ds.category.toLowerCase()] || 0;
      return calculateStrengthFromXp(ds, totalXp);
    });

    return NextResponse.json({ strengths });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}