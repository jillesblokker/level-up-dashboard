import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server-client';
import { apiLogger } from '@/lib/logger';
import { getCurrentMonthlyTitan } from '@/lib/titan-bosses';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const currentTitan = getCurrentMonthlyTitan();
    const currentMonthKey = `${new Date().getFullYear()}-${new Date().getMonth() + 1}`;

    // Get active alliance titan raid progress from preferences
    const { data: prefData } = await supabaseServer
      .from('user_preferences')
      .select('preference_value')
      .eq('user_id', userId)
      .eq('preference_key', `titan_raid_${currentMonthKey}`)
      .maybeSingle();

    const raidData = (prefData?.preference_value as any) || {
      damageDealt: 0,
      claimed: false,
      questsCompleted: 0,
      challengesCompleted: 0,
      milestonesCompleted: 0
    };

    const remainingHp = Math.max(0, currentTitan.totalHp - raidData.damageDealt);
    const isDefeated = remainingHp === 0;

    return NextResponse.json({
      titan: currentTitan,
      currentMonthKey,
      damageDealt: raidData.damageDealt,
      remainingHp,
      isDefeated,
      claimed: raidData.claimed,
      stats: {
        quests: raidData.questsCompleted,
        challenges: raidData.challengesCompleted,
        milestones: raidData.milestonesCompleted
      }
    });
  } catch (error) {
    apiLogger.error('Error fetching Titan raid status', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await request.json();
    const { action, type } = body; // 'attack' | 'claim' ; type: 'quest' (1 dmg) | 'challenge' (5 dmg) | 'milestone' (10 dmg)

    const currentTitan = getCurrentMonthlyTitan();
    const currentMonthKey = `${new Date().getFullYear()}-${new Date().getMonth() + 1}`;

    const { data: prefData } = await supabaseServer
      .from('user_preferences')
      .select('preference_value')
      .eq('user_id', userId)
      .eq('preference_key', `titan_raid_${currentMonthKey}`)
      .maybeSingle();

    const raidData = (prefData?.preference_value as any) || {
      damageDealt: 0,
      claimed: false,
      questsCompleted: 0,
      challengesCompleted: 0,
      milestonesCompleted: 0
    };

    if (action === 'attack') {
      let dmg = 1;
      if (type === 'challenge') dmg = 5;
      if (type === 'milestone') dmg = 10;

      const newDmg = Math.min(currentTitan.totalHp, raidData.damageDealt + dmg);
      const updatedRaidData = {
        ...raidData,
        damageDealt: newDmg,
        questsCompleted: raidData.questsCompleted + (type === 'quest' ? 1 : 0),
        challengesCompleted: raidData.challengesCompleted + (type === 'challenge' ? 1 : 0),
        milestonesCompleted: raidData.milestonesCompleted + (type === 'milestone' ? 1 : 0),
      };

      await supabaseServer
        .from('user_preferences')
        .upsert({
          user_id: userId,
          preference_key: `titan_raid_${currentMonthKey}`,
          preference_value: updatedRaidData,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,preference_key' });

      return NextResponse.json({
        success: true,
        damageDealt: dmg,
        totalDamage: newDmg,
        remainingHp: Math.max(0, currentTitan.totalHp - newDmg),
        isDefeated: newDmg >= currentTitan.totalHp
      });
    } else if (action === 'claim') {
      if (raidData.damageDealt < currentTitan.totalHp) {
        return new NextResponse(JSON.stringify({ error: 'Titan is not yet defeated this month!' }), { status: 400 });
      }
      if (raidData.claimed) {
        return new NextResponse(JSON.stringify({ error: 'Raid reward already claimed this month!' }), { status: 400 });
      }

      // Grant Gold & Gems
      const { data: currentStats } = await supabaseServer
        .from('character_stats')
        .select('gold, gems')
        .eq('user_id', userId)
        .single();

      await supabaseServer
        .from('character_stats')
        .update({
          gold: (currentStats?.gold || 0) + currentTitan.rewardGold,
          gems: (currentStats?.gems || 0) + currentTitan.rewardGems,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      await supabaseServer
        .from('user_preferences')
        .upsert({
          user_id: userId,
          preference_key: `titan_raid_${currentMonthKey}`,
          preference_value: { ...raidData, claimed: true },
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,preference_key' });

      return NextResponse.json({
        success: true,
        message: `Claimed Monthly Titan Defeat Reward! Received +${currentTitan.rewardGold} Gold and +${currentTitan.rewardGems} Gems!`
      });
    }

    return new NextResponse(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
  } catch (error) {
    apiLogger.error('Error in Titan raid API', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
