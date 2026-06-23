import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';
import { grantReward } from '@/app/api/kingdom/grantReward';

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
            // Fetch daily streak to calculate multiplier
            let streakDays = 0;
            try {
                const { data: streakData } = await supabase
                    .from('streaks')
                    .select('current_streak')
                    .eq('user_id', userId)
                    .maybeSingle();
                if (streakData) {
                    streakDays = streakData.current_streak || 0;
                }
            } catch (err) {
                logger.warn('[Smart Completion] Failed to fetch streak:', err);
            }
            const streakMultiplier = 1 + Math.min(1.0, streakDays * 0.1);

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
                const baseRewards = difficultyRewards[challenge.difficulty || 'medium'] || { xp: 50, gold: 50 };
                const rewards = {
                    xp: Math.floor(baseRewards.xp * streakMultiplier),
                    gold: Math.floor(baseRewards.gold * streakMultiplier)
                };

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

                try {
                    await grantReward({ userId, type: 'challenge', relatedId: questId, amount: rewards.xp, context: { gold: rewards.gold } });
                    await grantReward({ userId, type: 'gold', relatedId: questId, amount: rewards.gold, context: { xp: rewards.xp } });
                } catch (rewardError) {
                    logger.error('[Smart Completion] Error granting rewards for challenge:', rewardError);
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
            const currentHour = new Date().getHours();
            const isDay = currentHour >= 6 && currentHour < 18;
            
            const difficultyRewards: Record<string, { xp: number; gold: number }> = {
                easy: { xp: 25, gold: 25 },
                medium: { xp: 50, gold: 50 },
                hard: { xp: 100, gold: 100 }
            };
            const baseRewards = difficultyRewards[quest.difficulty || 'medium'] || { xp: 50, gold: 50 };
            
            // Apply Time-of-Day and Streak Bonuses
            const finalRewards = {
                gold: Math.floor((isDay ? Math.floor(baseRewards.gold * 1.2) : baseRewards.gold) * streakMultiplier),
                xp: Math.floor((!isDay ? Math.floor(baseRewards.xp * 1.2) : baseRewards.xp) * streakMultiplier)
            };

            const { error: insertError } = await supabase
                .from('quest_completion')
                .insert({
                    quest_id: questId,
                    user_id: userId,
                    completed: true,
                    completed_at: new Date().toISOString(),
                    xp_earned: finalRewards.xp,
                    gold_earned: finalRewards.gold
                });

            if (insertError) {
                if (insertError.code === '23505') { // Duplicate key
                    return { success: true, alreadyCompleted: true, message: 'Race condition: already completed' };
                }
                throw insertError;
            }

            // 4. Update Character Stats
            try {
                await grantReward({ userId, type: 'quest', relatedId: questId, amount: finalRewards.xp, context: { gold: finalRewards.gold } });
                await grantReward({ userId, type: 'gold', relatedId: questId, amount: finalRewards.gold, context: { xp: finalRewards.xp } });
            } catch (rewardError) {
                logger.error('[Smart Completion] Error granting rewards for quest:', rewardError);
            }

            // 5. Material Scavenging & Gem Drops (30% chance total: 10% Gems, 20% Materials)
            let scavengedMaterial = null;
            let droppedGems = 0;
            const dropRoll = Math.random();

            // Check if this is the very first quest completion ever to guarantee a drop
            const { count: completionCount } = await supabase
                .from('quest_completion')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId);

            const isFirstEver = completionCount === 1;
            
            if (dropRoll < 0.10 || isFirstEver) {
                // 10% chance for Gems! (or guaranteed 5 Gems if first ever)
                droppedGems = isFirstEver ? 5 : (Math.floor(Math.random() * 3) + 1); // 1-3 Gems normally
                try {
                    await grantReward({ userId, type: 'gems', amount: droppedGems, relatedId: questId });
                } catch (gemError) {
                    logger.error('[Smart Completion] Error granting gems:', gemError);
                }
            } 
            
            if ((dropRoll >= 0.10 && dropRoll < 0.30) || isFirstEver) {
                const category = (quest.category || 'might').toLowerCase();
                let materialId = 'material-logs';
                if (['might', 'craft'].includes(category)) materialId = 'material-steel';
                else if (['knowledge', 'honor', 'castle'].includes(category)) materialId = 'material-crystal';
                else if (['exploration'].includes(category)) materialId = 'material-planks';

                const { comprehensiveItems } = await import('@/app/lib/comprehensive-items');
                const materialRef = comprehensiveItems.find(i => i.id === materialId);

                if (materialRef) {
                    const { data: existing } = await supabase
                        .from('inventory_items')
                        .select('*')
                        .eq('user_id', userId)
                        .eq('item_id', materialId)
                        .single();

                    if (existing) {
                        await supabase
                            .from('inventory_items')
                            .update({ quantity: (existing.quantity || 1) + 1 })
                            .eq('id', existing.id);
                    } else {
                        await supabase
                            .from('inventory_items')
                            .insert({
                                user_id: userId,
                                item_id: materialRef.id,
                                name: materialRef.name,
                                type: materialRef.type,
                                category: materialRef.category,
                                description: materialRef.description,
                                emoji: materialRef.emoji,
                                image: materialRef.image,
                                stats: materialRef.stats || {},
                                quantity: 1,
                                equipped: false,
                                is_default: false
                            });
                    }
                    scavengedMaterial = { name: materialRef.name, emoji: materialRef.emoji };
                }
            }

            return { 
                success: true, 
                completed: true, 
                rewards: finalRewards, 
                bonusType: isDay ? 'Day (Gold)' : 'Night (XP)',
                scavengedMaterial,
                droppedGems
            };
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
