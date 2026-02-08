import { NextRequest, NextResponse } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';
import { apiLogger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

interface RpcResponse {
    success: boolean;
    error?: string;
    [key: string]: unknown;
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { listingId } = body;

        apiLogger.debug(`Market Buy Request: listingId=${listingId}`);

        if (!listingId) {
            return NextResponse.json({ error: 'Missing listingId' }, { status: 400 });
        }

        const result = await authenticatedSupabaseQuery(req, async (supabase, userId) => {
            // Call the secure RPC function
            apiLogger.info(`Processing purchase: listingId=${listingId}, buyerId=${userId}`);

            const { data, error } = await supabase
                .rpc('purchase_market_listing', {
                    p_listing_id: listingId,
                    p_buyer_id: userId
                });

            if (error) {
                apiLogger.error('RPC Error:', error);
                throw error;
            }

            return data as RpcResponse;
        });

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        const rpcResponse = result.data;

        if (!rpcResponse || !rpcResponse.success) {
            apiLogger.warn(`Purchase failed (logic): ${rpcResponse?.error || 'Unknown error'}`);
            return NextResponse.json({ error: rpcResponse?.error || 'Purchase failed' }, { status: 400 });
        }

        apiLogger.info(`Purchase successful: listingId=${listingId}`);
        return NextResponse.json({ message: 'Purchase successful' });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
        apiLogger.error('Market Buy API Error:', errorMessage);
        return NextResponse.json({ error: errorMessage }, { status: 400 });
    }
}
