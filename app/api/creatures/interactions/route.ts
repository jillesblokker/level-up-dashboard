
import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server-client';

const supabase = supabaseServer;

export async function GET(request: NextRequest) {
    try {
        const { userId } = await getAuth(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // We want to find which creature types are currently on "cooldown".
        // A creature is on cooldown if it was shaved less than 5 days ago.
        const fiveDaysAgo = new Date();
        fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

        const { data: interactions, error } = await supabase
            .from('creature_interactions')
            .select('creature_definition_id, occurred_at')
            .eq('user_id', userId)
            .eq('interaction_type', 'shave')
            .gt('occurred_at', fiveDaysAgo.toISOString());

        if (error) {
            console.error('Error fetching creature interactions:', error);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        // Extract unique definition IDs that are still on cooldown
        const cooldowns = [...new Set(interactions.map((i: any) => i.creature_definition_id))];

        return NextResponse.json({ cooldowns });

    } catch (error) {
        console.error('Unexpected error fetching interactions:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
