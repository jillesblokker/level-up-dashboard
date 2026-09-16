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
      milestonesCompleted: 0,
      petitionsCompleted: 0,
      petitionDamage: 0
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
    const actualPetitions = raidData.petitionsCompleted || 0;
    const petitionDmg = raidData.petitionDamage || (actualPetitions * 15);

    // Calculate live habit & petition damage for current month: 1 per quest, 5 per challenge, 10 per milestone, + petition decrees
    const calculatedDamage = (monthlyQuests * 1) + (actualChallenges * 5) + (actualMilestones * 10) + petitionDmg;
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

    let claimedTiers: string[] = Array.isArray(raidData.claimedTiers) ? raidData.claimedTiers : (raidData.claimed ? ['bronze', 'silver', 'gold', 'mythic'] : []);

    return NextResponse.json({
      titan: currentTitan,
      currentMonthKey,
      damageDealt: totalDamageDealt,
      remainingHp,
      isDefeated,
      claimed: !!raidData.claimed,
      claimedTiers,
      stats: {
        quests: monthlyQuests,
        challenges: actualChallenges,
        milestones: actualMilestones,
        petitions: actualPetitions
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
    const { action, type, tier, category, streak = 0, hasPet = false } = body; // 'record_habit' | 'claim'

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
      claimedTiers: [],
      questsCompleted: 0,
      challengesCompleted: 0,
      milestonesCompleted: 0,
      petitionsCompleted: 0,
      petitionDamage: 0
    };

    let claimedTiers: string[] = Array.isArray(raidData.claimedTiers) ? [...raidData.claimedTiers] : (raidData.claimed ? ['bronze', 'silver', 'gold', 'mythic'] : []);

    if (action === 'record_petition' || (action === 'record_habit' && type === 'petition')) {
      const dmg = typeof body.damage === 'number' && body.damage > 0 ? body.damage : 15;
      const newPetitions = (raidData.petitionsCompleted || 0) + 1;
      const newPetDmg = (raidData.petitionDamage || 0) + dmg;
      const newDmg = Math.min(currentTitan.totalHp, (raidData.damageDealt || 0) + dmg);

      const updatedRaidData = {
        ...raidData,
        damageDealt: newDmg,
        petitionsCompleted: newPetitions,
        petitionDamage: newPetDmg
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
        isDefeated: newDmg >= currentTitan.totalHp,
        titanName: currentTitan.name
      });
    }

    if (action === 'record_habit') {
      let baseDmg = 1;
      let newQuests = raidData.questsCompleted || 0;
      let newChallenges = raidData.challengesCompleted || 0;
      let newMilestones = raidData.milestonesCompleted || 0;

      if (type === 'challenge') {
        baseDmg = 5;
        newChallenges += 1;
      } else if (type === 'milestone') {
        baseDmg = 10;
        newMilestones += 1;
      } else {
        newQuests += 1;
      }

      // Critical strikes for Might/Vitality
      let multiplier = 1;
      if (category === 'might' || category === 'vitality') {
        multiplier *= 1.5;
      }
      // 7+ day streak doubles damage
      if (streak >= 7) {
        multiplier *= 2;
      }
      // Active guardian pet adds +25% striker boost
      if (hasPet) {
        multiplier *= 1.25;
      }

      const finalDmg = Math.round(baseDmg * multiplier);
      const newDmg = Math.min(currentTitan.totalHp, (raidData.damageDealt || 0) + finalDmg);
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
        damageDealt: finalDmg,
        totalDamage: newDmg,
        remainingHp: Math.max(0, currentTitan.totalHp - newDmg),
        isDefeated: newDmg >= currentTitan.totalHp
      });
    } else if (action === 'claim' || action === 'claim_tier') {
      const targetTier = tier || 'mythic';
      const hpPct = Math.round((raidData.damageDealt / currentTitan.totalHp) * 100);

      // Define tier thresholds & rewards
      const tierConfig: Record<string, { threshold: number; gold: number; gems: number; name: string }> = {
        bronze: { threshold: 25, gold: 250, gems: 5, name: 'Bronze Titan Chest' },
        silver: { threshold: 50, gold: 500, gems: 10, name: 'Silver Titan Chest' },
        gold: { threshold: 75, gold: 1000, gems: 20, name: 'Gold Titan Chest' },
        mythic: { threshold: 100, gold: currentTitan.rewardGold || 2500, gems: currentTitan.rewardGems || 50, name: 'Mythic Wyrm Slayer Chest' }
      };

      const cfg = tierConfig[targetTier] || tierConfig['mythic']!;

      if (hpPct < cfg.threshold) {
        return new NextResponse(JSON.stringify({ error: `Raid progress has not reached ${cfg.threshold}% yet!` }), { status: 400 });
      }

      if (claimedTiers.includes(targetTier)) {
        return new NextResponse(JSON.stringify({ error: `${cfg.name} has already been claimed this month!` }), { status: 400 });
      }

      // Add to claimed tiers
      claimedTiers.push(targetTier);
      const allClaimed = ['bronze', 'silver', 'gold', 'mythic'].every(t => claimedTiers.includes(t));

      // Grant Gold & Gems
      const { data: currentStats } = await supabaseServer
        .from('character_stats')
        .select('gold, gems')
        .eq('user_id', userId)
        .single();

      await supabaseServer
        .from('character_stats')
        .update({
          gold: (currentStats?.gold || 0) + cfg.gold,
          gems: (currentStats?.gems || 0) + cfg.gems,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      await supabaseServer
        .from('user_preferences')
        .upsert({
          user_id: userId,
          preference_key: `titan_raid_${currentMonthKey}`,
          preference_value: { ...raidData, claimed: allClaimed, claimedTiers },
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,preference_key' });

      return NextResponse.json({
        success: true,
        claimedTiers,
        message: `Claimed ${cfg.name}! Received +${cfg.gold} Gold and +${cfg.gems} Gems!`
      });
    }

    return new NextResponse(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
  } catch (error) {
    apiLogger.error('Error in Titan raid API', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
