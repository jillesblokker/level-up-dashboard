import { NextRequest, NextResponse } from 'next/server';
import { getMilestoneMessage } from '@/lib/milestone-manager';
import { grantReward } from '@/app/api/kingdom/grantReward';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server-client';
import { apiLogger } from '@/lib/logger';
import { calculateLevelFromExperience } from '@/types/character';
import { comprehensiveItems } from '@/app/lib/comprehensive-items';

export const dynamic = 'force-dynamic';

interface LootItem {
    type: string;
    amount?: number;
    name: string;
    itemId?: string;
    itemStats?: any;
    starRating?: number;
}

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { loot, status, dungeonId } = body; // loot array and final status (completed/defeated)

        if (!loot || !Array.isArray(loot)) {
            return NextResponse.json({ error: 'Invalid loot data' }, { status: 400 });
        }

        apiLogger.info(`Processing dungeon completion for user ${userId}, status: ${status}`);

        // Fetch current character stats for level scaling
        const { data: currentStats } = await supabaseServer
            .from('character_stats')
            .select('level, experience')
            .eq('user_id', userId)
            .single();

        const playerLevel = currentStats?.level || 1;

        // Calculate rewards
        let baseGold = loot.reduce((acc: number, item: LootItem) =>
            acc + (item.type === 'gold' ? (item.amount || 0) : 0), 0);
        
        // Scale gold reward: Gold Chest Reward = baseGold * (1 + playerLevel * 0.2)
        const totalGold = Math.floor(baseGold * (1 + playerLevel * 0.2));
        const totalXp = Math.floor(totalGold * 0.5);
        const totalGems = (status === 'completed' || status === 'victory') ? (5 + Math.floor(playerLevel / 10)) : 0;

        // Record Dungeon Run
        if (status === 'completed' || status === 'victory') {
            const { error: runError } = await supabaseServer
                .from('dungeon_runs')
                .insert({
                    user_id: userId,
                    dungeon_id: dungeonId || 'unknown',
                    loot_obtained: loot,
                    gold_earned: totalGold,
                    xp_earned: totalXp,
                    status: 'completed',
                    completed_at: new Date().toISOString()
                });

            if (runError) {
                apiLogger.error("Failed to record dungeon run", runError);
            }
        }

        // Grant gold
        if (totalGold > 0) {
            await supabaseServer.rpc('add_gold', { p_user_id: userId, p_amount: totalGold });
        }

        // Grant gems
        if (totalGems > 0) {
            try {
                await grantReward({ userId, type: 'gems', amount: totalGems, relatedId: dungeonId });
            } catch (gemError) {
                apiLogger.error("Failed to grant gems", gemError);
            }
        }

        // Grant XP
        if (totalXp > 0 && currentStats) {
            const newExperience = (currentStats.experience || 0) + totalXp;
            const newLevel = calculateLevelFromExperience(newExperience);

            await supabaseServer
                .from('character_stats')
                .update({
                    experience: newExperience,
                    level: newLevel
                })
                .eq('user_id', userId);
        }

        // Award Items
        const itemDrops = loot.filter((l: LootItem) => l.type === 'item' && l.itemId);
        if (itemDrops.length > 0) {
            for (const drop of itemDrops) {
                if (!drop.itemId) continue;

                const referenceItem = comprehensiveItems.find(i => i.id === drop.itemId);
                if (!referenceItem) continue;

                const { data: existing } = await supabaseServer
                    .from('inventory_items')
                    .select('*')
                    .eq('user_id', userId)
                    .eq('item_id', drop.itemId)
                    .single();

                if (existing) {
                    const currentStars = existing.star_rating || 0;
                    const newStars = drop.starRating || 0;
                    const bestStars = Math.max(currentStars, newStars);

                    await supabaseServer
                        .from('inventory_items')
                        .update({
                            quantity: existing.quantity + 1,
                            star_rating: bestStars
                        })
                        .eq('id', existing.id);
                } else {
                    await supabaseServer
                        .from('inventory_items')
                        .insert({
                            user_id: userId,
                            item_id: referenceItem.id,
                            name: drop.name,
                            type: referenceItem.type,
                            category: referenceItem.category,
                            description: referenceItem.description,
                            emoji: referenceItem.emoji,
                            image: referenceItem.image,
                            stats: referenceItem.stats || {},
                            quantity: 1,
                            equipped: false,
                            is_default: false,
                            star_rating: drop.starRating || 0
                        });
                }
            }
        }

        // --- Milestone Check ---
        let milestoneMessage = null;
        try {
            

            if (status === 'completed' || status === 'victory') {
                // Check total victories
                const { count } = await supabaseServer
                    .from('dungeon_runs')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', userId)
                    .eq('status', 'completed');

                if (count === 1) {
                    milestoneMessage = await getMilestoneMessage('dungeon_victory');
                } else if (count === 5) {
                    milestoneMessage = await getMilestoneMessage('dungeon_victory_5');
                } else if (count === 10) {
                    milestoneMessage = await getMilestoneMessage('dungeon_victory_10');
                } else {
                    // Just a general victory message if no specific count milestone
                    milestoneMessage = await getMilestoneMessage('dungeon_victory');
                }
            } else if (status === 'defeated') {
                milestoneMessage = await getMilestoneMessage('dungeon-defeat');
            }
        } catch (mErr) {
            apiLogger.warn('Milestone check error:', mErr);
        }

        // 10% chance to discover a potion recipe in a victory dungeon run
        let discoveredRecipe = null;
        if ((status === 'completed' || status === 'victory') && Math.random() < 0.1) {
            try {
                const { data: prefRow } = await supabaseServer
                    .from('user_preferences')
                    .select('*')
                    .eq('user_id', userId)
                    .eq('preference_key', 'unlocked_recipes')
                    .maybeSingle();

                const currentUnlocked = prefRow && Array.isArray(prefRow.preference_value)
                    ? prefRow.preference_value
                    : ["potion-focus", "potion-dread"];

                const allRecipes = ["potion-aegis", "potion-midas", "potion-sage", "potion-ironheart", "potion-mercury"];
                const undiscovered = allRecipes.filter((id: string) => !currentUnlocked.includes(id));

                if (undiscovered.length > 0) {
                    const newRecipeId = undiscovered[Math.floor(Math.random() * undiscovered.length)] as string;
                    const nextUnlocked = [...currentUnlocked, newRecipeId];

                    await supabaseServer
                        .from('user_preferences')
                        .upsert({
                            user_id: userId,
                            preference_key: 'unlocked_recipes',
                            preference_value: nextUnlocked,
                            updated_at: new Date().toISOString()
                        }, { onConflict: 'user_id,preference_key' });

                    const recipeNames: Record<string, { name: string; emoji: string }> = {
                        "potion-aegis": { name: "Aegis Draught", emoji: "🛡️" },
                        "potion-midas": { name: "Midas Draught", emoji: "🍯" },
                        "potion-sage": { name: "Sage Brew", emoji: "🍵" },
                        "potion-ironheart": { name: "Ironheart Tonic", emoji: "🧪" },
                        "potion-mercury": { name: "Mercury Elixir", emoji: "🔮" }
                    };
                    const info = recipeNames[newRecipeId as keyof typeof recipeNames] || { name: "Unknown Potion", emoji: "🧪" };
                    discoveredRecipe = { id: newRecipeId, name: info.name, emoji: info.emoji };
                    apiLogger.info(`User ${userId} discovered recipe ${newRecipeId} in dungeon`);
                }
            } catch (err) {
                apiLogger.error("Failed to process dungeon recipe unlock:", err);
            }
        }

        return NextResponse.json({
            success: true,
            rewards: {
                gold: totalGold,
                xp: totalXp,
                gems: totalGems,
                items: itemDrops.length
            },
            discoveredRecipe,
            milestoneMessage
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
        apiLogger.error('Dungeon completion error:', errorMessage);
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
