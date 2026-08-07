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
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${now.getMonth() + 1}`;
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Get saved raid preference
    const { data: prefData } = await supabaseServer
      .from('user_preferences')
      .select('preference_value')
      .eq('user_id', userId)
      .eq('preference_key', `titan_raid_${currentMonthKey}`)
      .maybeSingle();

    let raidData = (prefData?.preference_value as any) || {
      damageDealt: 0,
      claimed: false,
      questsCompleted: 0,
      challengesCompleted: 0,
      milestonesCompleted: 0
    };

    // Calculate actual habit completions from quest_completion table FOR CURRENT MONTH ONLY
    const { count: questCount } = await supabaseServer
      .from('quest_completion')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('completed_at', startOfMonth);

    const monthlyQuests = questCount || 0;
    const actualChallenges = raidData.challengesCompleted || 0;
    const actualMilestones = raidData.milestonesCompleted || 0;

    // Calculate live habit damage for current month: 1 per quest, 5 per challenge, 10 per milestone
    const calculatedDamage = (monthlyQuests * 1) + (actualChallenges * 5) + (actualMilestones * 10);
    const totalDamageDealt = Math.min(currentTitan.totalHp, Math.max(0, calculatedDamage));

    const remainingHp = Math.max(0, currentTitan.totalHp - totalDamageDealt);
    const isDefeated = totalDamageDealt >= currentTitan.totalHp;

    // Update persistent preference if data changed or was corrupted by all-time counts
    if (totalDamageDealt !== raidData.damageDealt || monthlyQuests !== raidData.questsCompleted) {
      raidData = {
        ...raidData,
        damageDealt: totalDamageDealt,
        questsCompleted: monthlyQuests,
      };

      await supabaseServer
        .from('user_preferences')
        .upsert({
          user_id: userId,
          preference_key: `titan_raid_${currentMonthKey}`,
          preference_value: raidData,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,preference_key' });
    }

    return NextResponse.json({
      titan: currentTitan,
      currentMonthKey,
      damageDealt: totalDamageDealt,
      remainingHp,
      isDefeated,
      claimed: !!raidData.claimed,
      stats: {
        quests: monthlyQuests,
        challenges: actualChallenges,
        milestones: actualMilestones
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
    const { action, type } = body; // 'record_habit' | 'claim'

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

    if (action === 'record_habit') {
      let dmg = 1;
      let newQuests = raidData.questsCompleted || 0;
      let newChallenges = raidData.challengesCompleted || 0;
      let newMilestones = raidData.milestonesCompleted || 0;

      if (type === 'challenge') {
        dmg = 5;
        newChallenges += 1;
      } else if (type === 'milestone') {
        dmg = 10;
        newMilestones += 1;
      } else {
        newQuests += 1;
      }

      const newDmg = Math.min(currentTitan.totalHp, (raidData.damageDealt || 0) + dmg);
      const updatedRaidData = {
        ...raidData,
        damageDealt: newDmg,
        questsCompleted: newQuests,
        challengesCompleted: newChallenges,
        milestonesCompleted: newMilestones,
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
