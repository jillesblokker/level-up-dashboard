import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { recordMinigameVirtuePoints } from '@/lib/house-cup-service';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { minigameType, points } = body;

    if (!minigameType) {
      return NextResponse.json({ error: 'Missing minigameType' }, { status: 400 });
    }

    const result = await recordMinigameVirtuePoints({
      userId,
      minigameType: minigameType as 'riddle' | 'plank_puzzle' | 'dice_game' | 'tarot',
      points: points !== undefined ? Number(points) : undefined,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    logger.error('[API house-cup/minigame-virtue] Error recording virtue points:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
