
import { NextRequest, NextResponse } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';
import { apiLogger } from '@/lib/logger';
import { comprehensiveItems } from '@/app/lib/comprehensive-items';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { itemId, quantity } = body;
        const qty = Math.max(1, parseInt(quantity) || 1);

        if (!itemId) {
            return NextResponse.json({ error: 'Missing itemId' }, { status: 400 });
        }

        const targetItem = comprehensiveItems.find(i => i.id === itemId);
        if (!targetItem) {
            return NextResponse.json({ error: 'Item not found in catalog' }, { status: 404 });
        }

        const totalCost = targetItem.cost * qty;

        const result = await authenticatedSupabaseQuery(req, async (supabase, userId) => {

            // 1. Check Balance
            const { data: stats } = await supabase
                .from('character_stats')
                .select('gold')
                .eq('user_id', userId)
                .single();

            if (!stats || (stats.gold || 0) < totalCost) {
                throw new Error(`Insufficient gold. Required: ${totalCost}, Available: ${stats?.gold || 0}`);
            }

            // 2. Deduct Gold
            // Assuming deduct_gold RPC exists and handles errors, but we checked balance already.
            const { error: deductError } = await supabase.rpc('deduct_gold', {
                p_user_id: userId,
                p_amount: totalCost
            });

            if (deductError) {
                apiLogger.error('Error deducting gold:', deductError);
                throw new Error('Transaction failed (payment)');
            }

            // 3. Add Item to Inventory
            // Check existing
            const { data: existing } = await supabase
                .from('inventory_items')
                .select('*')
                .eq('user_id', userId)
                .eq('item_id', itemId)
                .single();

            if (existing) {
                const { error: updateError } = await supabase
                    .from('inventory_items')
                    .update({ quantity: existing.quantity + qty })
                    .eq('id', existing.id);

                if (updateError) {
                    // CRITICAL: Gold deducted but item not given.
                    // In production we would refund here. For now just log error.
                    apiLogger.error('CRITICAL: Failed to update inventory after payment:', updateError);
                    throw new Error('Inventory update failed. Please contact support.');
                }
            } else {
                const { error: insertError } = await supabase
                    .from('inventory_items')
                    .insert({
                        user_id: userId,
                        item_id: targetItem.id,
                        name: targetItem.name,
                        type: targetItem.type,
                        category: targetItem.category,
                        description: targetItem.description,
                        emoji: targetItem.emoji,
                        image: targetItem.image,
                        stats: targetItem.stats || {},
                        quantity: qty,
                        equipped: false,
                        is_default: false
                    });

                if (insertError) {
                    apiLogger.error('CRITICAL: Failed to insert inventory after payment:', insertError);
                    throw new Error('Inventory insert failed. Please contact support.');
                }
            }

            return { success: true, newBalance: (stats.gold - totalCost), item: targetItem.name };
        });

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 }); // Status 400 for logic errors (insufficient gold)
        }

        return NextResponse.json({
            success: true,
            message: `Purchased ${qty}x ${targetItem.name}`,
            data: result.data
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
        apiLogger.error('Market NPC Buy Error:', errorMessage);
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
