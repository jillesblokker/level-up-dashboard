import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const COST = 1000;

    try {
        // Check Gold Balance
        const { data: statsData, error: statsError } = await supabase
            .from('character_stats')
            .select('gold, streak_tokens')
            .eq('user_id', userId)
            .single();

        if (statsError || !statsData) { throw new Error('Failed to fetch stats'); }
        if ((statsData.gold || 0) < COST) {
            return NextResponse.json({ error: 'Insufficient gold' }, { status: 402 });
        }

        // Atomic Update: Deduct Gold, Add Token
        const { error: updateError } = await supabase
            .from('character_stats')
            .update({
                gold: (statsData.gold || 0) - COST,
                streak_tokens: (statsData.streak_tokens || 0) + 1,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);

        if (updateError) throw updateError;

        return NextResponse.json({ success: true, message: 'Purchased 1 Build Token', newTokens: (statsData.streak_tokens || 0) + 1 });

    } catch (error: any) {
        console.error('Buy Token error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
