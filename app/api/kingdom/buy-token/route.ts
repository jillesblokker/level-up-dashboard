import { logger } from "@/lib/logger";
import { supabaseServer } from '@/lib/supabase/server-client';
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const COST = 1000;

    try {
        const { data: stats, error: statsError } = await supabaseServer
            .from('character_stats')
            .select('gold, tokens')
            .eq('user_id', userId)
            .single();

        if (statsError || !stats) {
            return NextResponse.json({ error: 'Character stats not found' }, { status: 404 });
        }

        if (stats.gold < COST) {
            return NextResponse.json({ error: 'Insufficient gold' }, { status: 400 });
        }

        const { error: updateError } = await supabaseServer
            .from('character_stats')
            .update({
                gold: stats.gold - COST,
                tokens: (stats.tokens || 0) + 1,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);

        if (updateError) {
            throw updateError;
        }

        return NextResponse.json({
            success: true,
            newGold: stats.gold - COST,
            newTokens: (stats.tokens || 0) + 1
        });
    } catch (error: any) {
        logger.error('[BUY-TOKEN] Error buying kingdom token:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
