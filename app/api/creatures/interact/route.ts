import { logger } from "@/lib/logger";

import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server-client';
import { CREATURE_DEFINITIONS } from '@/lib/creature-mapping';
import { grantReward } from '@/app/api/kingdom/grantReward';

const supabase = supabaseServer;

export async function POST(request: NextRequest) {
    try {
        const { userId } = await getAuth(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { instanceId, definitionId, action, itemId } = body;

        if (!definitionId) {
            return NextResponse.json({ error: 'Missing definitionId' }, { status: 400 });
        }

        const def = CREATURE_DEFINITIONS[definitionId];
        if (!def) {
            return NextResponse.json({ error: 'Invalid creature definition' }, { status: 400 });
        }

        // --- NEW: FEEDING LOGIC ---
        if (action === 'feed') {
            if (!itemId) return NextResponse.json({ error: 'Missing itemId for feeding' }, { status: 400 });

            const isTileInventory = itemId.startsWith('material-');
            let hasFood = false;

            if (isTileInventory) {
                const tileType = itemId === 'material-water' ? 'water' : itemId;
                const { data: item, error: itemError } = await supabase
                    .from('tile_inventory')
                    .select('*')
                    .eq('user_id', userId)
                    .eq('tile_type', tileType)
                    .single();

                if (!itemError && item && item.quantity > 0) {
                    hasFood = true;
                    if (item.quantity > 1) {
                        await supabase
                            .from('tile_inventory')
                            .update({ quantity: item.quantity - 1 })
                            .eq('user_id', userId)
                            .eq('tile_type', tileType);
                    } else {
                        await supabase
                            .from('tile_inventory')
                            .delete()
                            .eq('user_id', userId)
                            .eq('tile_type', tileType);
                    }
                }
            } else {
                const { data: item, error: itemError } = await supabase
                    .from('inventory_items')
                    .select('*')
                    .eq('user_id', userId)
                    .eq('item_id', itemId)
                    .single();

                if (!itemError && item && item.quantity > 0) {
                    hasFood = true;
                    if (item.quantity > 1) {
                        await supabase.from('inventory_items').update({ quantity: item.quantity - 1 }).eq('id', item.id);
                    } else {
                        await supabase.from('inventory_items').delete().eq('id', item.id);
                    }
                }
            }

            if (!hasFood) {
                return NextResponse.json({ error: 'You do not have this food item' }, { status: 400 });
            }

            // 3. Grant Luck Modifier
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 24);

            await supabase.from('active_modifiers').upsert({
                user_id: userId,
                name: 'Animal Luck',
                effect: 'Increases chance of rare loot in dungeons by 20%',
                expires_at: expiresAt.toISOString(),
                source: `Fed ${def.name}`
            }, { onConflict: 'user_id,name' });

            // 4. Record Interaction
            await supabase.from('creature_interactions').insert({
                user_id: userId,
                creature_definition_id: definitionId,
                creature_instance_id: instanceId,
                interaction_type: 'feed'
            });

            return NextResponse.json({
                message: `You fed the ${def.name}. It seems very happy! You gained 'Animal Luck' for 24 hours.`,
                fed: true,
                expiresAt: expiresAt.toISOString()
            });
        }

        // Logic Check: Is it an animal that gives rewards? (Sheep or Penguin)
        const isSheep = def.name.toLowerCase().includes('sheep');
        const isPenguin = def.name.toLowerCase().includes('penguin');

        if (!isSheep && !isPenguin) {
            // For now, only sheep and penguins give rewards. Others just interact.
            return NextResponse.json({
                message: `You greeted the ${def.name}. It looked at you weirdly.`,
                interacted: true
            });
        }

        const interactionType = isSheep ? 'shave' : 'play';
        const relatedId = isSheep ? 'sheep-shave' : 'penguin-play';

        // Check last interaction time for this user and this creature type
        const fiveDaysAgo = new Date();
        fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

        const { data: recentInteractions, error: fetchError } = await supabase
            .from('creature_interactions')
            .select('*')
            .eq('user_id', userId)
            .eq('creature_definition_id', definitionId)
            .eq('interaction_type', interactionType)
            .gt('occurred_at', fiveDaysAgo.toISOString())
            .order('occurred_at', { ascending: false })
            .limit(1);

        if (fetchError) {
            logger.error('Error checking interactions:', fetchError);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        if (recentInteractions && recentInteractions.length > 0) {
            const lastTime = new Date(recentInteractions[0].occurred_at);
            const daysLeft = 5 - Math.floor((Date.now() - lastTime.getTime()) / (1000 * 60 * 60 * 24));
            const actionVerb = isSheep ? 'shaved' : 'played with';

            return NextResponse.json({
                message: `You have already ${actionVerb} this ${def.name.toLowerCase()}! Come back in ${daysLeft} days.`,
                cooldown: true
            });
        }

        // Apply Reward
        const rewardAmount = 25;
        const success = await grantReward({
            userId,
            type: 'gold',
            amount: rewardAmount,
            relatedId: relatedId,
            context: { source: 'creature_interaction', creature: def.name }
        });

        if (!success) {
            return NextResponse.json({ error: 'Failed to grant reward' }, { status: 500 });
        }

        // Log Interaction
        await supabase
            .from('creature_interactions')
            .insert({
                user_id: userId,
                creature_definition_id: definitionId,
                creature_instance_id: instanceId, // Optional, logged for debug
                interaction_type: interactionType
            });

        const successMessage = isSheep
            ? `25 gold for the silver white fur of shaving Shaun the sheep!`
            : `25 gold found for petting the penguin!`;

        return NextResponse.json({
            message: successMessage,
            reward: { type: 'gold', amount: rewardAmount },
            shaved: true // Keeping property name for frontend compatibility, though semantically 'interacted'
        });

    } catch (error) {
        logger.error('Creature interaction error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
