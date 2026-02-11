
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server-client';
import { defaultStrengths, calculateStrengthFromXp } from '@/lib/strength-manager';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch quest history with category info
    // We join quest_completion with quest table via quest_id
    const { data: completions, error } = await supabaseServer
      .from('quest_completion')
      .select(`
                xp_earned,
                quest_id,
                quest:quests (
                    category
                )
            `)
      .eq('user_id', userId)
      .eq('completed', true);

    if (error) {
      console.error('Error fetching quest completions:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Aggregate XP
    const xpByCategory: Record<string, number> = {};

    if (completions) {
      completions.forEach((c: any) => {
        // If quest join worked, use that category.
        // If not (e.g. hardcoded quest not in DB), we might miss it unless we have another way.
        // Assuming DB contains the categories correctly.
        const category = c.quest?.category?.toLowerCase();

        if (category) {
          xpByCategory[category] = (xpByCategory[category] || 0) + (c.xp_earned || 0);
        } else {
          // Start of fallback: try to guess category or log?
          // console.warn('Quest completion without category:', c.quest_id);
        }
      });
    }

    // Populate strengths with calculated levels
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