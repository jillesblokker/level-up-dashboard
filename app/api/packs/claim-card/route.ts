import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server-client';
import { getAuth } from '@clerk/nextjs/server';

export async function POST(req: Request) {
    try {
        const { userId } = getAuth(req as any);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { cardId, variantId, packId } = await req.json();

        // Very basic validation - ideally we'd also verify the pack actually existed
        // but for now we just insert the mythic card
        const { error } = await supabaseServer
            .from('user_mythic_cards')
            .insert({
                user_id: userId,
                card_id: String(cardId),
                variant_id: String(variantId),
            });

        if (error) {
            console.error('Error claiming card:', error);
            return NextResponse.json({ error: 'Failed to claim card' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Claim card error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
