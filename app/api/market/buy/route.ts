import { NextRequest, NextResponse } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { listingId } = await req.json();

        if (!listingId) {
            return NextResponse.json({ error: 'Missing listingId' }, { status: 400 });
        }

        const result = await authenticatedSupabaseQuery(req, async (supabase, userId) => {
            // Call the secure RPC function
            const { data, error } = await supabase
                .rpc('purchase_market_listing', {
                    p_listing_id: listingId,
                    p_buyer_id: userId
                });

            if (error) throw error;
            return data;
        });

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        // result.data contains the JSONB returned by the RPC ({ success: ..., error?: ... })
        const rpcResponse = result.data;

        if (!rpcResponse.success) {
            return NextResponse.json({ error: rpcResponse.error }, { status: 400 });
        }

        return NextResponse.json({ message: 'Purchase successful' });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
