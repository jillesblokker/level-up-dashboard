import { NextRequest, NextResponse } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';
import { getHouseCupCircleStandings } from '@/lib/house-cup-service';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const result = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
      const { searchParams } = new URL(request.url);
      const type = searchParams.get('type') || 'monthly'; // 'monthly' | 'annual'
      const year = new Date().getFullYear();
      const month = new Date().getMonth() + 1;

      const standings = await getHouseCupCircleStandings(userId, year);

      // Find circle leader and viewer standings
      const viewerStanding = standings.find(s => s.is_viewer) || standings[0];
      const sortedByPoints = [...standings].sort((a, b) => b.total_points - a.total_points);
      const champion = sortedByPoints[0] || viewerStanding;

      const allyCount = Math.max(0, standings.length - 1);
      
      // Calculate scaling rewards based on allies participating
      const baseGold = type === 'annual' ? 2500 : 800;
      const baseEssence = type === 'annual' ? 50 : 15;
      
      const scaledGold = Math.round(baseGold * (1 + allyCount * 0.25));
      const scaledEssence = Math.round(baseEssence * (1 + allyCount * 0.20));

      return {
        type,
        year,
        month,
        standings,
        champion,
        viewerStanding,
        allyCount,
        rewards: {
          gold: scaledGold,
          essence: scaledEssence,
          trophyTitle: type === 'annual' ? 'House Cup Sovereign' : 'Virtue Champion',
        }
      };
    });

    if (!result.success || !result.data) {
      return NextResponse.json({ error: result.error || 'Failed to fetch recap' }, { status: 401 });
    }

    return NextResponse.json(result.data);
  } catch (error: any) {
    logger.error('[House Cup Recap API] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch recap' }, { status: 500 });
  }
}
