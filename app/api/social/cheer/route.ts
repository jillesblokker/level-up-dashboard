import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server-client';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
    try {
        const { userId: currentUserId } = await auth();
        if (!currentUserId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { targetUserId } = body;

        if (!targetUserId) {
            return NextResponse.json({ success: false, error: 'Missing targetUserId' }, { status: 400 });
        }

        if (currentUserId === targetUserId) {
            return NextResponse.json({ success: false, error: 'Cannot cheer yourself' }, { status: 400 });
        }

        const REWARD_GOLD = 5;
        const REWARD_XP = 10;

        // Fetch current stats for the target user
        const { data: stats, error: statsError } = await supabaseServer
            .from('character_stats')
            .select('experience, gold')
            .eq('user_id', targetUserId)
            .single();

        if (statsError || !stats) {
            logger.error('Failed to fetch target user stats for cheer', statsError);
            return NextResponse.json({ success: false, error: 'Failed to fetch user stats' }, { status: 500 });
        }

        // Update target user stats
        const { error: updateError } = await supabaseServer
            .from('character_stats')
            .update({
                experience: (stats.experience || 0) + REWARD_XP,
                gold: (stats.gold || 0) + REWARD_GOLD,
            })
            .eq('user_id', targetUserId);

        if (updateError) {
            logger.error('Failed to update target user stats for cheer', updateError);
            return NextResponse.json({ success: false, error: 'Failed to update user stats' }, { status: 500 });
        }

        logger.debug(`[SOCIAL] User ${currentUserId} cheered ${targetUserId}. Granted ${REWARD_GOLD} gold and ${REWARD_XP} XP.`);

        return NextResponse.json({ success: true, message: 'Cheer sent successfully', rewards: { gold: REWARD_GOLD, xp: REWARD_XP } });

    } catch (error: any) {
        logger.error('Cheer API Catch Error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
