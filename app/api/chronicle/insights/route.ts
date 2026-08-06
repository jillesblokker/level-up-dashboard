import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server-client';
import { apiLogger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

    // Fetch 7-day habit completions
    const { data: completions } = await supabaseServer
      .from('challenge_completion')
      .select('*, challenges(category, title)')
      .eq('user_id', userId)
      .eq('completed', true)
      .gte('date', sevenDaysAgo);

    // Fetch 7-day chronicle entries
    const { data: entries } = await supabaseServer
      .from('chronicle_entries')
      .select('mood, created_at')
      .eq('user_id', userId)
      .gte('created_at', sevenDaysAgo);

    const totalCompletions = completions?.length || 0;

    // Calculate category breakdown
    const categories: Record<string, number> = {};
    (completions || []).forEach((c: any) => {
      const cat = c.challenges?.category || 'might';
      categories[cat] = (categories[cat] || 0) + 1;
    });

    let topCategory = 'might';
    let maxCatCount = 0;
    Object.entries(categories).forEach(([cat, count]) => {
      if (count > maxCatCount) {
        maxCatCount = count;
        topCategory = cat;
      }
    });

    // Calculate mood distribution
    const moodCounts: Record<string, number> = {};
    (entries || []).forEach((e: any) => {
      if (e.mood) {
        moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
      }
    });

    // Generate personalized synthesis takeaway
    let takeaway = "Maintain your momentum! Building daily habits creates long-term persistency.";
    if (totalCompletions >= 15) {
      takeaway = `Exceptional focus! You completed ${totalCompletions} habits over the last 7 days with peak strength in ${topCategory.toUpperCase()}.`;
    } else if (totalCompletions >= 7) {
      takeaway = `Great consistency! You averaged ${Math.round(totalCompletions / 7)} habits per day. Your strongest growth domain is ${topCategory.toUpperCase()}.`;
    } else if (totalCompletions > 0) {
      takeaway = `Good start! Focus on completing 5 habits per day to hit your daily sweet spot and level up faster.`;
    }

    return NextResponse.json({
      totalCompletions,
      topCategory: topCategory.charAt(0).toUpperCase() + topCategory.slice(1),
      topCategoryCount: maxCatCount,
      peakFocusWindow: "Morning 8 AM - 11 AM",
      moodDistribution: moodCounts,
      takeaway
    });
  } catch (error) {
    apiLogger.error('[Chronicle Insights API] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
