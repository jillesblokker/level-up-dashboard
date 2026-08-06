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

    // Fetch user alliances
    const { data: alliances } = await supabaseServer
      .from('alliances')
      .select('*')
      .contains('members', [userId]);

    if (!alliances || alliances.length === 0) {
      return NextResponse.json({
        hasAlliance: false,
        activeCombo: false,
        multiplier: 1.0,
        activeMemberCount: 0,
        expiresInSeconds: 0
      });
    }

    const alliance = alliances[0];
    const memberIds = alliance.members || [userId];

    // Check completions in the last 2 hours
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const today = getToday();

    const { data: recentCompletions } = await supabaseServer
      .from('challenge_completion')
      .select('user_id, updated_at, date')
      .in('user_id', memberIds)
      .eq('date', today)
      .eq('completed', true)
      .gte('updated_at', twoHoursAgo);

    const activeUserSet = new Set((recentCompletions || []).map(c => c.user_id));
    const activeMemberCount = activeUserSet.size;

    // Active combo if 2 or more members completed habits within 2 hours
    const activeCombo = activeMemberCount >= 2;
    const multiplier = activeCombo ? 1.5 : 1.0;

    return NextResponse.json({
      hasAlliance: true,
      allianceName: alliance.name,
      activeCombo,
      multiplier,
      activeMemberCount,
      totalMembers: memberIds.length,
      expiresInMinutes: activeCombo ? 120 : 0
    });
  } catch (error) {
    apiLogger.error('[Alliance Synergy API] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
