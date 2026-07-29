import { NextRequest, NextResponse } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';
import { getHouseCupCircleStandings } from '@/lib/house-cup-service';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const result = await authenticatedSupabaseQuery(request, async (_, userId) => {
      const { searchParams } = new URL(request.url);
      const yearParam = searchParams.get('year');
      const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

      const standings = await getHouseCupCircleStandings(userId, year);

      return {
        year,
        standings,
      };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    logger.error('[House Cup Standings API] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch standings' }, { status: 500 });
  }
}
