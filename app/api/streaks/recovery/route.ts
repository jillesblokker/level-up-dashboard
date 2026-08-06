import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server-client';
import { apiLogger } from '@/lib/logger';
import { getToday } from '@/lib/date-utils';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = getToday();

    // Fetch user streaks
    const { data: streaks } = await supabaseServer
      .from('streaks')
      .select('*')
      .eq('user_id', userId);

    // Fetch today's habit completions
    const { data: completions } = await supabaseServer
      .from('challenge_completion')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .eq('completed', true);

    const completedTodayCount = completions?.length || 0;

    // Check if any streak was missed yesterday
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const atRiskStreaks = (streaks || []).filter(s => {
      if (!s.last_check_in) return false;
      const lastCheckIn = new Date(s.last_check_in).toISOString().split('T')[0];
      return lastCheckIn !== today && lastCheckIn !== yesterday;
    });

    const isEligible = atRiskStreaks.length > 0;
    const isCompleted = completedTodayCount >= 2;

    return NextResponse.json({
      eligible: isEligible,
      completedTodayCount,
      requiredCount: 2,
      isCompleted,
      atRiskCount: atRiskStreaks.length,
      category: atRiskStreaks[0]?.category || 'might'
    });
  } catch (error) {
    apiLogger.error('[Streak Recovery API GET] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = getToday();

    // Verify today's completions
    const { data: completions } = await supabaseServer
      .from('challenge_completion')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .eq('completed', true);

    const completedTodayCount = completions?.length || 0;

    if (completedTodayCount < 2) {
      return NextResponse.json({
        error: 'Incomplete requirement: Complete at least 2 habits today to repair your streak.'
      }, { status: 400 });
    }

    // Repair streaks
    const { data: streaks } = await supabaseServer
      .from('streaks')
      .select('*')
      .eq('user_id', userId);

    if (streaks && streaks.length > 0) {
      for (const streak of streaks) {
        const newStreak = Math.max(1, (streak.current_streak || 0) + 1);
        await supabaseServer
          .from('streaks')
          .upsert({
            user_id: userId,
            category: streak.category,
            current_streak: newStreak,
            last_check_in: new Date().toISOString()
          }, { onConflict: 'user_id,category' });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Streak successfully repaired! Overdrive Recovery bonus granted.'
    });
  } catch (error) {
    apiLogger.error('[Streak Recovery API POST] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
