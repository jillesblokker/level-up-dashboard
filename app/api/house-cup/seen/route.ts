import { NextRequest, NextResponse } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const result = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
      const { data: seenData } = await supabase
        .from('house_cup_seen')
        .select('category_id, seen_points, seen_at')
        .eq('user_id', userId);

      const seenMap: Record<string, number> = {};
      if (seenData) {
        seenData.forEach(row => {
          seenMap[row.category_id] = row.seen_points || 0;
        });
      }

      return { seen: seenMap };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    logger.error('[House Cup Seen API] GET Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch seen points' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { seenMap } = body; // Record<category_id, seen_points>

    if (!seenMap || typeof seenMap !== 'object') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const result = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
      const nowIso = new Date().toISOString();

      for (const [catId, pts] of Object.entries(seenMap)) {
        await supabase
          .from('house_cup_seen')
          .upsert({
            user_id: userId,
            category_id: catId.toLowerCase(),
            seen_points: Number(pts) || 0,
            seen_at: nowIso,
          }, { onConflict: 'user_id,category_id' });
      }

      return { success: true };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    logger.error('[House Cup Seen API] POST Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save seen points' }, { status: 500 });
  }
}
