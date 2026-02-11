import { NextRequest, NextResponse } from 'next/server';
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

        // Calculate rewards
        let totalGold = loot.reduce((acc: number, item: LootItem) =>
            acc + (item.type === 'gold' ? (item.amount || 0) : 0), 0);
        let totalXp = Math.floor(totalGold * 0.5);

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

        // Grant XP
        if (totalXp > 0) {
            const { data: currentStats } = await supabaseServer
                .from('character_stats')
                .select('experience')
                .eq('user_id', userId)
                .single();

            if (currentStats) {
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

        apiLogger.info(`Dungeon completion processed: ${totalGold}g, ${totalXp}xp, ${itemDrops.length} items`);

        return NextResponse.json({
            success: true,
            rewards: { gold: totalGold, xp: totalXp, items: itemDrops.length }
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
        apiLogger.error('Dungeon completion error:', errorMessage);
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
