import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server-client';
import { apiLogger } from '@/lib/logger';
import { grantReward } from '@/app/api/kingdom/grantReward';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await request.json();
    const { action } = body; // 'get_vow' | 'claim_benediction' | 'give_alms'

    const today = new Date().toISOString().split('T')[0];

    // Check user's completed quests or habits for today
    const { data: userQuests } = await supabaseServer
      .from('user_quests')
      .select('id, completed, updated_at')
      .eq('user_id', userId)
      .eq('completed', true);

    const todayCompletedCount = userQuests?.filter(q => {
      const dateStr = new Date(q.updated_at).toISOString().split('T')[0];
      return dateStr === today;
    }).length || 0;

    const vowTarget = 1; // Require at least 1 completed quest/habit today for benediction
    const vowFulfilled = todayCompletedCount >= vowTarget;

    if (action === 'get_vow') {
      return NextResponse.json({
        today,
        vowTarget,
        todayCompletedCount,
        vowFulfilled
      });
    }

    if (action === 'claim_benediction') {
      if (!vowFulfilled) {
        return new NextResponse(JSON.stringify({ error: 'Vow of Focus not yet fulfilled today. Complete at least 1 quest!' }), { status: 400 });
      }

      await grantReward({ userId, type: 'experience', amount: 200, context: 'abbey-benediction' });
      await grantReward({ userId, type: 'gems', amount: 10, context: 'abbey-benediction' });

      return NextResponse.json({
        success: true,
        message: "The Abbot bestows his Holy Benediction! Received +200 XP and +10 Gems."
      });
    } else if (action === 'give_alms') {
      await grantReward({ userId, type: 'experience', amount: 75, context: 'abbey-alms' });

      return NextResponse.json({
        success: true,
        message: "You gave alms to the pilgrims. Grace shines upon you (+75 XP)!"
      });
    }

    return new NextResponse(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
  } catch (error) {
    apiLogger.error('Error in abbey API', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
