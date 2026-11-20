import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server-client';
import { apiLogger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

interface Champion {
  id: string;
  name: string;
  avatar: string;
  habitsCount: number;
  sharePercent: number;
  projectedGold: number;
  isCurrentUser?: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    
    // Calculate days remaining in the month
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const diffMs = Math.max(0, endOfMonth.getTime() - now.getTime());
    const daysRemaining = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hoursRemaining = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    // Base Crown Treasury deposit
    const baseTreasuryGold = 5000;

    let userHabits = 0;
    let activeDays = 0;
    let isPledged = false;
    let hasClaimed = false;

    if (userId) {
      try {
        // 1. Fetch user preference for this month's pot
        const { data: prefData } = await supabaseServer
          .from('user_preferences')
          .select('preference_value')
          .eq('user_id', userId)
          .eq('preference_key', `royal_pot_${currentMonthKey}`)
          .maybeSingle();

        const userPref = (prefData?.preference_value as any) || {};
        isPledged = !!userPref.pledged;
        hasClaimed = !!userPref.claimed;

        // 2. Fetch habits completed this month
        const { data: completions } = await supabaseServer
          .from('quest_completion')
          .select('completed_at')
          .eq('user_id', userId)
          .gte('completed_at', startOfMonth);

        if (Array.isArray(completions)) {
          userHabits = completions.length;
          // Count unique calendar days
          const uniqueDays = new Set(
            completions.map(c => new Date(c.completed_at).toISOString().split('T')[0])
          );
          activeDays = uniqueDays.size;
        }
      } catch (dbErr) {
        apiLogger.warn('[Royal Pot API] DB fetch non-fatal fallback:', dbErr);
      }
    }

    // Community contributions calculation:
    // Base 5,000 + (estimated community habits * 2) + extra bonus
    // Scales dynamically with the day of the month
    const dayOfMonth = now.getDate();
    const simulatedCommunityHabits = 320 + (dayOfMonth * 48) + (userHabits * 2);
    const totalPotGold = baseTreasuryGold + (simulatedCommunityHabits * 2) + (isPledged ? 50 : 0);

    const championsPool = Math.round(totalPotGold * 0.6);
    const dividendPool = Math.round(totalPotGold * 0.4);

    // Mock companions / circle allies to race against
    const companions = [
      { id: 'ally-1', name: 'Lyra Moonwhisper', avatar: '/images/creatures/AstralWolf.webp', habits: Math.max(userHabits + 4, 38) },
      { id: 'ally-2', name: 'Torin Ironheart', avatar: '/images/creatures/ArmoredBear.webp', habits: Math.max(userHabits + 1, 32) },
      { id: 'ally-3', name: 'Elena Sunstrider', avatar: '/images/creatures/GoldenGriffon.webp', habits: Math.max(userHabits - 1, 28) },
      { id: 'ally-4', name: 'Rowan Silverbranch', avatar: '/images/creatures/SpiritSprite.webp', habits: Math.max(userHabits - 4, 24) },
      { id: 'ally-5', name: 'Kael Stonebreaker', avatar: '/images/creatures/Turtoisy.webp', habits: Math.max(userHabits - 7, 19) },
    ];

    // Combine player into contenders
    const contenders = [
      ...companions.map(c => ({
        id: c.id,
        name: c.name,
        avatar: c.avatar,
        habitsCount: c.habits,
        isCurrentUser: false,
      })),
      {
        id: userId || 'current-user',
        name: 'You',
        avatar: '/images/character/hero-portrait.webp',
        habitsCount: userHabits,
        isCurrentUser: true,
      }
    ];

    // Sort descending by habits
    contenders.sort((a, b) => b.habitsCount - a.habitsCount);

    // Top 5 distribution shares (25%, 15%, 10%, 5%, 5% of champions pool)
    const shareWeights = [0.25, 0.15, 0.10, 0.05, 0.05];
    const top5: Champion[] = contenders.slice(0, 5).map((entry, idx) => {
      const sharePercent = Math.round((shareWeights[idx] || 0.05) * 100);
      const projectedGold = Math.round(championsPool * (shareWeights[idx] || 0.05));
      return {
        ...entry,
        sharePercent,
        projectedGold,
      };
    });

    // Check user's position in top 5 or rank
    const userRank = contenders.findIndex(c => c.isCurrentUser) + 1;
    const userTop5Entry = top5.find(c => c.isCurrentUser);

    // 15 days active needed for 40% dividend
    const targetDays = 15;
    const isDividendEligible = activeDays >= targetDays;
    // Estimate ~12 qualifiers for the dividend
    const estimatedDividendQualifiers = 12;
    const estimatedUserDividend = Math.round(dividendPool / estimatedDividendQualifiers);

    return NextResponse.json({
      success: true,
      data: {
        currentMonthKey,
        monthName: now.toLocaleString('default', { month: 'long' }),
        year: now.getFullYear(),
        daysRemaining,
        hoursRemaining,
        totalPotGold,
        championsPool,
        dividendPool,
        baseTreasuryGold,
        userStats: {
          isPledged,
          hasClaimed,
          userHabits,
          activeDays,
          targetDays,
          isDividendEligible,
          userRank,
          isInTop5: !!userTop5Entry,
          projectedTop5Gold: userTop5Entry ? userTop5Entry.projectedGold : 0,
          projectedDividendGold: isDividendEligible ? estimatedUserDividend : 0,
        },
        top5,
      }
    });
  } catch (error: any) {
    apiLogger.error('[Royal Pot API] GET Error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    if (action === 'pledge') {
      // Record pledge in user_preferences
      try {
        const { data: prefData } = await supabaseServer
          .from('user_preferences')
          .select('preference_value')
          .eq('user_id', userId)
          .eq('preference_key', `royal_pot_${currentMonthKey}`)
          .maybeSingle();

        const currentPref = (prefData?.preference_value as any) || {};

        await supabaseServer
          .from('user_preferences')
          .upsert({
            user_id: userId,
            preference_key: `royal_pot_${currentMonthKey}`,
            preference_value: {
              ...currentPref,
              pledged: true,
              pledgedAt: new Date().toISOString(),
            },
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id,preference_key' });
      } catch (err) {
        apiLogger.warn('[Royal Pot API] Pledge DB save fallback:', err);
      }

      return NextResponse.json({
        success: true,
        message: 'Pledged to royal pot',
        isPledged: true,
      });
    }

    if (action === 'claim') {
      try {
        const { data: prefData } = await supabaseServer
          .from('user_preferences')
          .select('preference_value')
          .eq('user_id', userId)
          .eq('preference_key', `royal_pot_${currentMonthKey}`)
          .maybeSingle();

        const currentPref = (prefData?.preference_value as any) || {};

        await supabaseServer
          .from('user_preferences')
          .upsert({
            user_id: userId,
            preference_key: `royal_pot_${currentMonthKey}`,
            preference_value: {
              ...currentPref,
              claimed: true,
              claimedAt: new Date().toISOString(),
            },
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id,preference_key' });
      } catch (err) {
        apiLogger.warn('[Royal Pot API] Claim DB save fallback:', err);
      }

      return NextResponse.json({
        success: true,
        message: 'Claimed royal dividend',
        hasClaimed: true,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    apiLogger.error('[Royal Pot API] POST Error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
