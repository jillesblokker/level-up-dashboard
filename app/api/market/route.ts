import { NextRequest, NextResponse } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const sort = searchParams.get('sort') || 'newest';

    const result = await authenticatedSupabaseQuery(req, async (supabase) => {
        let query = supabase
            .from('market_listings')
            .select('*')
            .eq('status', 'active');

        // Apply filters
        if (type && type !== 'all') {
            query = query.eq('item_type', type);
        }

        // Apply sorting
        if (sort === 'lowest_price') {
            query = query.order('price', { ascending: true });
        } else if (sort === 'highest_price') {
            query = query.order('price', { ascending: false });
        } else {
            // Default: Newest
            query = query.order('created_at', { ascending: false });
        }

        const { data, error } = await query.limit(50);
        if (error) throw error;
        return data;
    });

    if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ listings: result.data });
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { item_type, item_id, price, quantity } = body;

        // Validation
        if (!item_type || !item_id || !price || price <= 0) {
            return NextResponse.json({ error: 'Invalid listing data' }, { status: 400 });
        }

        const result = await authenticatedSupabaseQuery(req, async (supabase, userId) => {
            // Verify inventory ownership for inventory/material items
            const requiredQty = quantity || 1;
            const { data: invItem } = await supabase
                .from('inventory_items')
                .select('quantity')
                .eq('user_id', userId)
                .eq('item_id', item_id)
                .maybeSingle();

            if (invItem && (invItem.quantity || 0) < requiredQty) {
                throw new Error(`Insufficient inventory: Required ${requiredQty}, available ${invItem.quantity || 0}`);
            }

            const { data, error } = await supabase
                .from('market_listings')
                .insert({
                    seller_id: userId,
                    item_type,
                    item_id,
                    quantity: quantity || 1,
                    price,
                    status: 'active'
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        });

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({ listing: result.data, message: 'Listing created successfully' });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
