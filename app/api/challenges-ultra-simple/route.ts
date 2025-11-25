import { supabaseServer } from '@/lib/supabase/server-client';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
    try {
        console.log('[Challenges-Ultra-Simple] Starting...');

        // Simple Clerk authentication
        const { userId } = await auth();
        console.log('[Challenges-Ultra-Simple] Auth result:', { userId: !!userId });

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch all challenges
        console.log('[Challenges-Ultra-Simple] Fetching challenges...');
        const { data: allChallenges, error: challengesError } = await supabaseServer
            .from('challenges')
            .select('*');

        if (challengesError) {
            console.error('[Challenges-Ultra-Simple] Challenges error:', challengesError);
            return NextResponse.json({ error: challengesError.message }, { status: 500 });
        }

        console.log('[Challenges-Ultra-Simple] Found challenges:', allChallenges?.length || 0);

        // Return challenges with default status
        const challengesWithStatus = (allChallenges || []).map((challenge: any) => ({
            ...challenge,
            completed: false,
            isNew: false
        }));

        console.log('[Challenges-Ultra-Simple] Returning:', challengesWithStatus.length);
        return NextResponse.json(challengesWithStatus);

    } catch (error) {
        console.error('[Challenges-Ultra-Simple] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
