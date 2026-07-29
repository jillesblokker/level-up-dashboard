import { NextRequest, NextResponse } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';
import { getHouseCupCircleStandings } from '@/lib/house-cup-service';
import { addToCharacterStat } from '@/lib/character-stats-service';
import { grantReward } from '@/app/api/kingdom/grantReward';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const result = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
      const currentYear = new Date().getFullYear();
      const targetYear = currentYear - 1; // Prior year settlement

      // Check if already settled/claimed for targetYear
      const { data: existingResult } = await supabase
        .from('house_cup_results')
        .select('*')
        .eq('viewer_id', userId)
        .eq('cup_year', targetYear)
        .maybeSingle();

      if (existingResult) {
        return {
          unclaimed: !existingResult.acknowledged_at,
          result: existingResult,
        };
      }

      // Check if user has activity in prior year
      const standings = await getHouseCupCircleStandings(userId, targetYear);
      const viewerStanding = standings.find(s => s.is_viewer);
      const alliesCount = standings.filter(s => !s.is_viewer).length;

      if (!viewerStanding || viewerStanding.total_points === 0) {
        return { unclaimed: false, result: null };
      }

      return {
        unclaimed: true,
        targetYear,
        alliesCount,
        viewerStanding,
        standings,
      };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    logger.error('[House Cup Settlement GET] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to check settlement' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const result = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
      const currentYear = new Date().getFullYear();
      const targetYear = currentYear - 1;

      // Check if already claimed
      const { data: existing } = await supabase
        .from('house_cup_results')
        .select('*')
        .eq('viewer_id', userId)
        .eq('cup_year', targetYear)
        .maybeSingle();

      if (existing && existing.acknowledged_at) {
        return { success: true, alreadyClaimed: true };
      }

      const standings = await getHouseCupCircleStandings(userId, targetYear);
      const viewerStanding = standings.find(s => s.is_viewer) || standings[0];
      const alliesCount = standings.filter(s => !s.is_viewer).length;

      // Calculate tier rewards (§8)
      let goldReward = 100;
      let gemReward = 1;
      let mythicPacks = 0;

      if (alliesCount >= 10) {
        goldReward = 10000;
        gemReward = 30;
        mythicPacks = 2;
      } else if (alliesCount >= 3) {
        goldReward = 5000;
        gemReward = 20;
        mythicPacks = 1;
      } else if (alliesCount >= 1) {
        goldReward = 1000;
        gemReward = 5;
        mythicPacks = 0;
      }

      // Add category winner bonuses (+5 Gems per category won)
      const categoryBonuses = (viewerStanding?.categories_won || 0) * 5;
      gemReward += categoryBonuses;

      // Grant Gold and Gems
      await addToCharacterStat('gold', goldReward, 'House Cup Settlement');
      await addToCharacterStat('gems', gemReward, 'House Cup Settlement');

      // Grant Mythic Packs if applicable
      for (let i = 0; i < mythicPacks; i++) {
        await grantReward({
          userId,
          type: 'item',
          relatedId: 'mythic_pack',
          amount: 1,
        }).catch(() => {});
      }

      // Record result as claimed/acknowledged
      const nowIso = new Date().toISOString();
      await supabase
        .from('house_cup_results')
        .upsert({
          viewer_id: userId,
          cup_year: targetYear,
          winner_user_id: standings[0]?.user_id || userId,
          standings: standings as any,
          ally_count: alliesCount,
          rewards_granted_at: nowIso,
          acknowledged_at: nowIso,
        }, { onConflict: 'viewer_id,cup_year' });

      return {
        success: true,
        rewards: {
          gold: goldReward,
          gems: gemReward,
          mythicPacks,
          categoriesWon: viewerStanding?.categories_won || 0,
        },
      };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    logger.error('[House Cup Settlement POST] Error:', error);
    return NextResponse.json({ error: error.message || 'Settlement claim failed' }, { status: 500 });
  }
}
