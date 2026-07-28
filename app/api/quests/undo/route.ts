import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { getTodayDateString } from '@/lib/date-utils'

const supabase = createClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['SUPABASE_SERVICE_ROLE_KEY']!
)

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth()

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { questId } = body

        if (!questId) {
            return NextResponse.json({ error: 'Quest ID is required' }, { status: 400 })
        }

        // Get recent completion record for this quest
        const { data: completions, error: fetchError } = await supabase
            .from('quest_completion')
            .select('*')
            .eq('quest_id', questId)
            .eq('user_id', userId)
            .order('completed_at', { ascending: false });

        if (fetchError || !completions || completions.length === 0) {
            return NextResponse.json({ error: 'No completion record found for this quest' }, { status: 404 });
        }

        const todayStr = getTodayDateString();
        const latestCompletion = completions.find(c => {
            if (!c.completed_at) return false;
            const cDate = c.completed_at.split('T')[0];
            return cDate === todayStr;
        }) || completions[0];

        const xpEarned = latestCompletion?.xp_earned || 0;
        const goldEarned = latestCompletion?.gold_earned || 0;

        // Delete the completion record from database
        const { error: deleteError } = await supabase
            .from('quest_completion')
            .delete()
            .eq('id', latestCompletion.id);

        if (deleteError) {
            logger.error('Error undoing quest completion:', deleteError);
            return NextResponse.json({ error: 'Failed to undo quest completion' }, { status: 500 });
        }

        // Deduct rewards from character stats if applicable
        const { data: currentStats } = await supabase
            .from('character_stats')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (currentStats) {
            const newXP = Math.max(0, (currentStats.experience || 0) - xpEarned);
            const newGold = Math.max(0, (currentStats.gold || 0) - goldEarned);

            await supabase
                .from('character_stats')
                .update({
                    experience: newXP,
                    gold: newGold,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', userId);
        }

        return NextResponse.json({
            success: true,
            undone: true,
            questId,
            revertedRewards: { xp: xpEarned, gold: goldEarned }
        });
    } catch (error) {
        logger.error('Error in /api/quests/undo:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
