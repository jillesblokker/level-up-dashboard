import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { recordDungeonVictoryVirtuePoints } from '@/lib/house-cup-service';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { floor = 1, difficulty = 'normal', primaryCategory = 'might', petStrikerUsed = false } = body;

    const result = await recordDungeonVictoryVirtuePoints({
      userId,
      floor: Number(floor),
      difficulty,
      primaryCategory,
      petStrikerUsed: Boolean(petStrikerUsed),
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    logger.error('[API house-cup/dungeon-virtue] Error recording virtue points:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
