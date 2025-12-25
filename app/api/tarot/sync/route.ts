import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server-client';

export async function POST(request: NextRequest) {
    try {
        const { userId } = await getAuth(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { card } = await request.json();
        if (!card) {
            return NextResponse.json({ error: 'Missing card data' }, { status: 400 });
        }

        // Store today's card in user_preferences JSONB
        // We'll store it under preferences -> daily_fate
        const { data: currentPrefs } = await supabaseServer
            .from('user_preferences')
            .select('preferences')
            .eq('user_id', userId)
            .maybeSingle();

        const preferences = currentPrefs?.preferences || {};
        preferences.daily_fate = {
            card,
            date: new Date().toISOString().split('T')[0]
        };

        const { error } = await supabaseServer
            .from('user_preferences')
            .upsert({
                user_id: userId,
                preferences,
                updated_at: new Date().toISOString()
            });

        if (error) {
            console.error('[Tarot Sync] Error saving preference:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Tarot Sync] Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
