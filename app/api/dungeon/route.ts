import { NextRequest, NextResponse } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';
import { apiLogger } from '@/lib/logger';
import { calculateKingdomBonuses, KingdomBonuses } from '@/lib/kingdom-utils';
import { calculateLevelFromExperience } from '@/types/character';
import { comprehensiveItems } from '@/app/lib/comprehensive-items';

// Types
interface Loot {
    type: string;
    amount?: number;
    name: string;
    itemId?: string;
    itemStats?: any;
    starRating?: number;
}

interface Encounter {
    type: 'monster' | 'treasure';
    hp?: number; // for monster
    maxHp?: number;
    difficulty?: number;
    loot?: Loot[];
}

interface DungeonRun {
    id: string;
    user_id: string;
    current_room: number;
    current_hp: number;
    max_hp: number;
    status: 'in_progress' | 'completed' | 'defeated';
    current_encounter: Encounter;
    loot_collected: Loot[];
    created_at: string;
    max_rooms: number;
}

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action, runId, choice, itemId } = body; // itemId added for usage

        return await authenticatedSupabaseQuery(req, async (supabase, userId) => {
            // --- ACTION: START RUN ---
            if (action === 'start') {
                // 1. Check Gold & Fetch Stats + Kingdom Grid
                const { data: stats } = await supabase
                    .from('character_stats')
                    .select('gold, vitality, strength, intelligence')
                    .eq('user_id', userId)
                    .single();

                const { data: kingdomGrid } = await supabase
                    .from('kingdom_grid')
                    .select('grid_data')
                    .eq('user_id', userId)
                    .single();

                const bonuses = calculateKingdomBonuses(kingdomGrid?.grid_data || []);

                if (!stats || stats.gold < 50) {
                    apiLogger.warn(`Insufficient gold for dungeon run: ${stats?.gold || 0}`);
                    throw new Error('Insufficient Gold (50G required)');
                }

                // 2. Deduct Gold
                await supabase.rpc('deduct_gold', { p_user_id: userId, p_amount: 50 });

                // 3. Create Run
                // Base HP = 100 + ((Vitality + Bonus) * 10)
                const { data: equippedItems } = await supabase
                    .from('inventory_items')
                    .select('stats, star_rating')
                    .eq('user_id', userId)
                    .eq('equipped', true);

                let equipHealth = 0;
                equippedItems?.forEach((i: any) => {
                    const stars = i.star_rating || 0;
                    const multiplier = 1 + (stars === 1 ? 0.1 : stars === 2 ? 0.25 : stars === 3 ? 0.5 : 0);
                    equipHealth += Math.floor((i.stats?.health || 0) * multiplier);
                });

                const totalVitality = (stats.vitality || 1) + bonuses.vitality;
                const maxHp = 100 + (totalVitality * 10) + equipHealth;

                const firstEncounter = generateEncounter(1);

                const { data: newRun, error } = await supabase
                    .from('dungeon_runs')
                    .insert({
                        user_id: userId,
                        current_room: 1,
                        current_hp: maxHp,
                        max_hp: maxHp,
                        status: 'in_progress',
                        current_encounter: firstEncounter,
                        loot_collected: [],
                        max_rooms: 5 // Default run length
                    })
                    .select()
                    .single();

                if (error) throw error;

                apiLogger.info(`Started dungeon run ${newRun.id} for user ${userId}`);
                return newRun;
            }

            // --- ACTION: PLAY TURN (FIGHT/FLEE/OPEN/USE_ITEM) ---
            if (action === 'play') {
                if (!runId) throw new Error('Missing runId');

                // 1. Fetch Run
                const { data: run } = await supabase
                    .from('dungeon_runs')
                    .select('*')
                    .eq('id', runId)
                    .single();

                if (!run || run.status !== 'in_progress') {
                    apiLogger.warn(`Attempted to play inactive run: ${runId}`);
                    throw new Error('Run not active');
                }

                // 2. Resolve Action
                const encounter = run.current_encounter;
                let resultMessage = '';
                let damageTaken = 0;
                let lootFound: Loot | null = null;
                let isRoomCleared = false;

                if (encounter.type === 'monster') {
                    // Fetch Stats for Combat/Effects
                    const { data: currentStats } = await supabase
                        .from('character_stats')
                        .select('strength, intelligence')
                        .eq('user_id', userId)
                        .single();

                    const { data: kingdomGrid } = await supabase
                        .from('kingdom_grid')
                        .select('grid_data')
                        .eq('user_id', userId)
                        .single();

                    const bonuses = calculateKingdomBonuses(kingdomGrid?.grid_data || []);
                    const strength = (currentStats?.strength || 1) + bonuses.strength;

                    const { data: equippedItems } = await supabase
                        .from('inventory_items')
                        .select('stats, star_rating')
                        .eq('user_id', userId)
                        .eq('equipped', true);

                    let equipAttack = 0;
                    let equipDefense = 0;
                    equippedItems?.forEach((i: any) => {
                        const stars = i.star_rating || 0;
                        const multiplier = 1 + (stars === 1 ? 0.1 : stars === 2 ? 0.25 : stars === 3 ? 0.5 : 0);
                        equipAttack += Math.floor((i.stats?.attack || 0) * multiplier);
                        equipDefense += Math.floor((i.stats?.defense || 0) * multiplier);
                    });

                    // Monster Params
                    const roomDifficulty = run.current_room || 1;
                    const monsterDmg = Math.floor(2 + (roomDifficulty * 1.5) + (Math.random() * 5));

                    // Decision Branch
                    if (choice === 'use_item' && itemId) {
                        // --- Use Potion ---
                        const { data: itemToUse } = await supabase
                            .from('inventory_items')
                            .select('*')
                            .eq('user_id', userId)
                            .eq('item_id', itemId)
                            .single();

                        if (!itemToUse || (itemToUse.quantity || 0) <= 0) {
                            throw new Error('Item not found or empty');
                        }

                        const healBase = itemToUse.stats?.health || 0;
                        if (healBase <= 0) throw new Error('Item has no healing effect');

                        const iStars = itemToUse.star_rating || 0;
                        const iMult = 1 + (iStars === 1 ? 0.1 : iStars === 2 ? 0.25 : iStars === 3 ? 0.5 : 0);
                        const healAmount = Math.floor(healBase * iMult);

                        // Apply
                        run.current_hp = Math.min(run.max_hp, run.current_hp + healAmount);

                        // Consume
                        if (itemToUse.quantity > 1) {
                            await supabase.from('inventory_items').update({ quantity: itemToUse.quantity - 1 }).eq('id', itemToUse.id);
                        } else {
                            await supabase.from('inventory_items').delete().eq('id', itemToUse.id);
                        }

                        resultMessage = `Used ${itemToUse.name} (+${healAmount} HP).`;

                        // Monster Attack (Turn Cost)
                        damageTaken = Math.max(1, monsterDmg - equipDefense);
                        resultMessage += ` Monster hit you for ${damageTaken} damage.`;

                    } else if (choice === 'fight') {
                        // --- Fight ---
                        const userDmg = Math.floor(5 + (strength * 0.5) + equipAttack + (Math.random() * 5));

                        encounter.hp = (encounter.hp || 30) - userDmg;
                        damageTaken = Math.max(1, monsterDmg - equipDefense);

                        resultMessage = `You hit for ${userDmg} dmg! Monster hit back for ${damageTaken} dmg.`;

                        if (encounter.hp <= 0) {
                            isRoomCleared = true;
                            resultMessage += ' Monster defeated!';
                            lootFound = generateLoot(run.current_room);
                        }
                    } else if (choice === 'flee') {
                        // --- Flee ---
                        if (Math.random() > 0.5) {
                            isRoomCleared = true;
                            resultMessage = 'You fled successfully!';
                        } else {
                            damageTaken = 10;
                            resultMessage = 'Failed to flee! Took 10 damage.';
                        }
                    } else {
                        throw new Error('Invalid combat action');
                    }

                } else if (encounter.type === 'treasure') {
                    isRoomCleared = true;
                    lootFound = generateLoot(run.current_room);
                    resultMessage = 'You found treasure!';
                }

                // 3. Update State
                let newHp = run.current_hp - damageTaken;
                let newStatus = run.status;
                let newRoom = run.current_room;
                let newEncounter = encounter;
                const newLoot = run.loot_collected || [];

                if (lootFound) newLoot.push(lootFound);

                if (newHp <= 0) {
                    newStatus = 'defeated';
                    newHp = 0;
                    resultMessage += ' YOU DIED.';
                } else if (isRoomCleared) {
                    if (newRoom >= (run.max_rooms || 5)) {
                        newStatus = 'completed';
                        resultMessage += ' DUNGEON CLEARED!';
                        newLoot.push({ type: 'gold', amount: 500, name: 'Completion Bonus' });
                    } else {
                        newRoom++;
                        newEncounter = generateEncounter(newRoom);
                        resultMessage += ' Proceeding to next room...';
                    }
                }

                const { data: updatedRun, error } = await supabase
                    .from('dungeon_runs')
                    .update({
                        current_hp: newHp,
                        current_room: newRoom,
                        status: newStatus,
                        current_encounter: isRoomCleared && newStatus === 'in_progress' ? newEncounter : run.current_encounter,
                        loot_collected: newLoot
                    })
                    .eq('id', runId)
                    .select()
                    .single();

                if (error) {
                    apiLogger.error('Error updating dungeon run:', error);
                    throw error;
                }

                if (newStatus !== 'in_progress') {
                    const { data: kingdomGrid } = await supabase.from('kingdom_grid').select('grid_data').eq('user_id', userId).single();
                    const endBonuses = calculateKingdomBonuses(kingdomGrid?.grid_data || []);

                    await processEndRun(supabase, userId, newLoot, endBonuses);
                    apiLogger.info(`Dungeon run ${runId} finished with status: ${newStatus}`);
                }

                return { ...updatedRun, message: resultMessage, actionResult: { damageTaken, lootFound } };
            }

            throw new Error('Invalid action');
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
        apiLogger.error('Dungeon API Error:', errorMessage);
        return NextResponse.json({ error: errorMessage }, { status: 500 }); // Status 500 for API errors
    }
}

function generateEncounter(roomLevel: number): Encounter {
    const isTreasure = Math.random() < 0.2; // 20% chance of treasure
    if (isTreasure) {
        return { type: 'treasure' };
    }
    // Monster scaling
    return {
        type: 'monster',
        hp: 20 + (roomLevel * 5),
        maxHp: 20 + (roomLevel * 5),
        difficulty: roomLevel
    };
}

function generateLoot(roomLevel: number): Loot | null {
    if (Math.random() > 0.3) return null; // 30% chance of loot

    // Generate Items instead of just gold
    const possibleItems = comprehensiveItems.filter(i => {
        if (roomLevel < 3) return i.rarity === 'common' || i.rarity === 'uncommon';
        if (roomLevel < 7) return i.rarity === 'rare' || i.rarity === 'epic';
        return i.rarity === 'legendary';
    }).filter(i => i.type === 'weapon' || i.type === 'potion' || i.type === 'armor' || i.type === 'shield' || i.type === 'material');

    if (possibleItems.length > 0) {
        const item = possibleItems[Math.floor(Math.random() * possibleItems.length)];

        // Roll for Star Rating
        const roll = Math.random();
        let stars = 0;
        if (roll < 0.01) stars = 3;      // 1% Radiant
        else if (roll < 0.05) stars = 2; // 4% Gleaming
        else if (roll < 0.15) stars = 1; // 10% Polished

        const starPrefix = stars === 3 ? 'Radiant ' : stars === 2 ? 'Gleaming ' : stars === 1 ? 'Polished ' : '';

        return {
            type: 'item',
            name: `${starPrefix}${item.name}`,
            itemId: item.id,
            itemStats: item.stats,
            starRating: stars
        };
    }

    return { type: 'gold', amount: 50 + (roomLevel * 10), name: 'Gold Coins' };
}

// Helpers
import { SupabaseClient } from '@supabase/supabase-js';

async function processEndRun(supabase: SupabaseClient, userId: string, loot: Loot[], bonuses: any) {
    let totalGold = loot.reduce((acc, item) => acc + (item.type === 'gold' ? (item.amount || 0) : 0), 0);

    // Apply Gold Bonus
    if (bonuses && bonuses.goldBonusPercent) {
        totalGold = Math.floor(totalGold * (1 + (bonuses.goldBonusPercent / 100)));
    }

    // Calculate XP
    let totalXp = Math.floor(totalGold * 0.5);

    // Apply XP Bonus
    if (bonuses && bonuses.xpBonusPercent) {
        totalXp = Math.floor(totalXp * (1 + (bonuses.xpBonusPercent / 100)));
    }

    if (totalGold > 0) {
        await supabase.rpc('add_gold', { p_user_id: userId, p_amount: totalGold });
    }

    if (totalXp > 0) {
        const { data: currentStats } = await supabase
            .from('character_stats')
            .select('experience')
            .eq('user_id', userId)
            .single();

        if (currentStats) {
            const newExperience = (currentStats.experience || 0) + totalXp;
            const newLevel = calculateLevelFromExperience(newExperience);

            await supabase
                .from('character_stats')
                .update({
                    experience: newExperience,
                    level: newLevel
                })
                .eq('user_id', userId);
        }
    }

    // Award Items
    const itemDrops = loot.filter(l => l.type === 'item' && l.itemId);
    if (itemDrops.length > 0) {
        for (const drop of itemDrops) {
            if (!drop.itemId) continue;

            const referenceItem = comprehensiveItems.find(i => i.id === drop.itemId);
            if (!referenceItem) continue;

            // Check if user already has item
            const { data: existing } = await supabase
                .from('inventory_items')
                .select('*')
                .eq('user_id', userId)
                .eq('item_id', drop.itemId)
                .single();

            if (existing) {
                // Upgrade Rating if new is better
                const currentStars = existing.star_rating || 0;
                const newStars = drop.starRating || 0;
                const bestStars = Math.max(currentStars, newStars);

                await supabase
                    .from('inventory_items')
                    .update({
                        quantity: existing.quantity + 1,
                        star_rating: bestStars
                    })
                    .eq('id', existing.id);
            } else {
                await supabase
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
}
