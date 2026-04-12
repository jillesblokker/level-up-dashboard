import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';

// This endpoint is used by the "Bulk Complete All" feature in the frontend.
// It handles marking a quest as complete intelligently (checking for existing completions, etc.)

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { questId } = body;

        logger.debug('[Smart Completion v2] Processing request for quest:', questId);

        if (!questId) {
            return NextResponse.json({ error: 'Quest ID is required' }, { status: 400 });
        }

        // Use authenticated query to ensure user context is set (RLS)
        const result = await authenticatedSupabaseQuery(req, async (supabase, userId) => {

            // 1. Fetch the quest to get rewards info
            const { data: quest, error: questError } = await supabase
                .from('quests')
                .select('*')
                .eq('id', questId)
                .single();

            if (questError || !quest) {
                // If not found in quests, check challenges (legacy support)
                const { data: challenge, error: challengeError } = await supabase
                    .from('challenges')
                    .select('*')
                    .eq('id', questId)
                    .single();

                if (challengeError || !challenge) {
                    throw new Error('Quest not found');
                }

                // 2. Check if already completed TODAY
                const today = new Date().toISOString().split('T')[0];
                const { data: existing } = await supabase
                    .from('quest_completion')
                    .select('id')
                    .eq('quest_id', questId)
                    .eq('user_id', userId)
                    .gte('completed_at', today)
                    .single();

                if (existing) {
                    return { success: true, alreadyCompleted: true, message: 'Already completed today' };
                }

                // 3. Insert completion
                const difficultyRewards: Record<string, { xp: number; gold: number }> = {
                    easy: { xp: 25, gold: 25 },
                    medium: { xp: 50, gold: 50 },
                    hard: { xp: 100, gold: 100 }
                };
                const rewards = difficultyRewards[challenge.difficulty || 'medium'] || { xp: 50, gold: 50 };

                const { error: insertError } = await supabase
                    .from('quest_completion')
                    .insert({
                        quest_id: questId,
                        user_id: userId,
                        completed: true,
                        completed_at: new Date().toISOString(),
                        xp_earned: rewards.xp,
                        gold_earned: rewards.gold
                    });

                if (insertError) {
                    if (insertError.code === '23505') { // Duplicate key
                        return { success: true, alreadyCompleted: true, message: 'Race condition: already completed' };
                    }
                    throw insertError;
                }

                return { success: true, completed: true, rewards };
            }

            // Quest found in 'quests' table
            // 2. Check if already completed TODAY
            const today = new Date().toISOString().split('T')[0];

            const { data: existing } = await supabase
                .from('quest_completion')
                .select('id')
                .eq('quest_id', questId)
                .eq('user_id', userId)
                .gte('completed_at', today)
                .single();

            if (existing) {
                return { success: true, alreadyCompleted: true, message: 'Already completed today' };
            }

            // 3. Mark as complete
            const difficultyRewards: Record<string, { xp: number; gold: number }> = {
                easy: { xp: 25, gold: 25 },
                medium: { xp: 50, gold: 50 },
                hard: { xp: 100, gold: 100 }
            };
            const rewards = difficultyRewards[quest.difficulty || 'medium'] || { xp: 50, gold: 50 };

            const { error: insertError } = await supabase
                .from('quest_completion')
                .insert({
                    quest_id: questId,
                    user_id: userId,
                    completed: true,
                    completed_at: new Date().toISOString(),
                    xp_earned: rewards.xp,
                    gold_earned: rewards.gold
                });

            if (insertError) {
                if (insertError.code === '23505') { // Duplicate key
                    return { success: true, alreadyCompleted: true, message: 'Race condition: already completed' };
                }
                throw insertError;
            }

            // 4. Update Character Stats
            await supabase.rpc('grant_rewards', {
                p_user_id: userId,
                p_gold: rewards.gold,
                p_xp: rewards.xp
            });

            return { success: true, completed: true, rewards };
        });

        if (!result.success) {
            // Determine status code based on error message/type
            const status = (result.error?.includes('auth') || result.error?.includes('session')) ? 401 : 500;
            return NextResponse.json({ error: result.error }, { status });
        }

        return NextResponse.json(result.data);

    } catch (error: any) {
        logger.error('[Smart Completion] Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

export async function OPTIONS(request: NextRequest) {
    return NextResponse.json({}, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
