import { NextRequest, NextResponse } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';

// This endpoint is used by the "Bulk Complete All" feature in the frontend.
// It handles marking a quest as complete intelligently (checking for existing completions, etc.)

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { questId } = body;

        console.log('[Smart Completion v2] Processing request for quest:', questId);

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

                // Use challenge data as quest
                // Re-assign quest variable or use challenge data below
                // For simplicity, let's just proceed with challenge data mapped

                // 2. Check if already completed TODAY
                const today = new Date().toISOString().split('T')[0];
                const { data: existing } = await supabase
                    .from('quest_completion') // or challenge_completion?
                    // The frontend seems to treat these as "Quests". 
                    // If the ID came from 'challenges' table, we should probably insert into 'challenge_completion' OR 'quest_completion'.
                    // Given typical "Bulk Complete" naming, it's likely Quests.
                    // Let's assume 'quest_completion' is the target.
                    .select('id')
                    .eq('quest_id', questId)
                    .eq('user_id', userId)
                    .gte('completed_at', today)
                    .single();

                if (existing) {
                    return { success: true, alreadyCompleted: true, message: 'Already completed today' };
                }

                // 3. Insert completion
                // Determine rewards
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

                if (insertError) throw insertError;

                return { success: true, completed: true, rewards };
            }

            // Quest found in 'quests' table

            // 2. Check if already completed TODAY
            const today = new Date().toISOString().split('T')[0]; // Simple UTC date

            // Logic from api/quests/complete/route.ts
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
                throw insertError;
            }

            // 4. Update Character Stats (Simple increment)
            await supabase.rpc('grant_rewards', {
                p_user_id: userId,
                p_gold: rewards.gold,
                p_xp: rewards.xp
            });

            // 5. Productivity Milestones & Encouraging Messages
            let milestoneMessage = null;
            try {
                const todayStr = new Date().toISOString().split('T')[0];

                // Today's Quest Count
                const { count: questsToday } = await supabase
                    .from('quest_completion')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', userId)
                    .eq('completed', true)
                    .gte('completed_at', `${todayStr}T00:00:00`)
                    .lte('completed_at', `${todayStr}T23:59:59`);

                // Current Streak
                const { data: charStats } = await supabase
                    .from('character_stats')
                    .select('streak_days')
                    .eq('user_id', userId)
                    .single();

                const { getMilestoneMessage } = await import('@/lib/encouraging-messages');

                if (charStats?.streak_days === 7) {
                    milestoneMessage = getMilestoneMessage('streak_7');
                } else if (charStats?.streak_days === 3) {
                    milestoneMessage = getMilestoneMessage('streak_3');
                } else if (questsToday === 10) {
                    milestoneMessage = getMilestoneMessage('quests_10');
                } else if (questsToday === 5) {
                    milestoneMessage = getMilestoneMessage('quests_5');
                } else if (questsToday === 3) {
                    milestoneMessage = getMilestoneMessage('quests_3');
                }
            } catch (milestoneErr) {
                console.warn('[Smart Completion] Error checking milestones:', milestoneErr);
            }

            return { success: true, completed: true, rewards, milestoneMessage };
        });

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 401 });
        }

        return NextResponse.json(result.data);

    } catch (error: any) {
        console.error('[Smart Completion] Error:', error);
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
