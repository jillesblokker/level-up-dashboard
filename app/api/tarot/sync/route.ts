import { logger } from "@/lib/logger";
import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server-client';

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data, error } = await supabaseServer
            .from('user_preferences')
            .select('preference_value')
            .eq('user_id', userId)
            .eq('preference_key', 'daily_fate')
            .maybeSingle();

        if (error) {
            logger.error('[Tarot Sync GET] Error fetching daily fate:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            status: 'ok',
            endpoint: 'tarot/sync',
            dailyFate: data?.preference_value || null
        });
    } catch (error) {
        logger.error('[Tarot Sync GET] Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { card } = await request.json();
        if (!card) {
            return NextResponse.json({ error: 'Missing card data' }, { status: 400 });
        }

        const { error } = await supabaseServer
            .from('user_preferences')
            .upsert({
                user_id: userId,
                preference_key: 'daily_fate',
                preference_value: {
                    card,
                    date: new Date().toISOString().split('T')[0]
                },
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id,preference_key'
            });

        if (error) {
            logger.error('[Tarot Sync] Error saving preference:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error('[Tarot Sync] Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
