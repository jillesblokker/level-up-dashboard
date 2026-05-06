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
            const currentHour = new Date().getHours();
            const isDay = currentHour >= 6 && currentHour < 18;
            
            const difficultyRewards: Record<string, { xp: number; gold: number }> = {
                easy: { xp: 25, gold: 25 },
                medium: { xp: 50, gold: 50 },
                hard: { xp: 100, gold: 100 }
            };
            const baseRewards = difficultyRewards[quest.difficulty || 'medium'] || { xp: 50, gold: 50 };
            
            // Apply Time-of-Day Bonuses
            const finalRewards = {
                gold: isDay ? Math.floor(baseRewards.gold * 1.2) : baseRewards.gold,
                xp: !isDay ? Math.floor(baseRewards.xp * 1.2) : baseRewards.xp
            };

            const { error: insertError } = await supabase
                .from('quest_completion')
                .insert({
                    quest_id: questId,
                    user_id: userId,
                    completed: true,
                    completed_at: new Date().toISOString(),
                    xp_earned: finalRewards.xp,
                    gold_earned: finalRewards.gold,
                    is_day_bonus: isDay,
                    is_night_bonus: !isDay
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
                p_gold: finalRewards.gold,
                p_xp: finalRewards.xp
            });

            // 5. Material Scavenging (30% chance)
            let scavengedMaterial = null;
            if (Math.random() < 0.3) {
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
                scavengedMaterial
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
