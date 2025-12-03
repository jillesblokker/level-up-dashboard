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

        // Fetch all challenges (user's own + global challenges with user_id = NULL)
        console.log('[Challenges-Ultra-Simple] Fetching challenges...');
        const { data: allChallenges, error: challengesError } = await supabaseServer
            .from('challenges')
            .select('*')
            .or(`user_id.is.null,user_id.eq.${userId}`);

        if (challengesError) {
            console.error('[Challenges-Ultra-Simple] Challenges error:', challengesError);
            return NextResponse.json({ error: challengesError.message }, { status: 500 });
        }

        console.log('[Challenges-Ultra-Simple] Found challenges:', allChallenges?.length || 0);

        // Get today's date in Netherlands timezone
        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Amsterdam' });
        console.log('[Challenges-Ultra-Simple] Today:', today);

        // Fetch today's completions
        const { data: completions, error: completionError } = await supabaseServer
            .from('challenge_completion')
            .select('*')
            .eq('user_id', userId);

        if (completionError) {
            console.error('[Challenges-Ultra-Simple] Completion error:', completionError);
            // Continue anyway, just without completion status
        }

        console.log('[Challenges-Ultra-Simple] Found completions:', completions?.length || 0);

        // Filter to today's completions
        const todaysCompletions = (completions || []).filter((c: any) => {
            const completionDate = String(c.date).split('T')[0];
            return completionDate === today;
        });

        console.log('[Challenges-Ultra-Simple] Today\'s completions:', todaysCompletions.length);

        // Map completions by challenge_id
        const completionMap = new Map();
        todaysCompletions.forEach((c: any) => {
            completionMap.set(c.challenge_id, {
                completed: c.completed,
                completionId: c.id,
                date: c.date
            });
        });

        // Return challenges with completion status
        const challengesWithStatus = (allChallenges || []).map((challenge: any) => {
            const completion = completionMap.get(challenge.id);
            return {
                ...challenge,
                completed: completion?.completed || false,
                completionId: completion?.completionId,
                date: completion?.date,
                isNew: false
            };
        });

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

export async function PUT(request: Request) {
    try {
        console.log('[Challenges-Ultra-Simple PUT] Starting...');

        // Simple Clerk authentication
        const { userId } = await auth();
        console.log('[Challenges-Ultra-Simple PUT] Auth result:', { userId: !!userId });

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { challengeId, completed } = body;

        if (!challengeId || completed === undefined) {
            return NextResponse.json({ error: 'Missing challengeId or completed status' }, { status: 400 });
        }

        // Get today's date in Netherlands timezone
        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Amsterdam' });
        console.log('[Challenges-Ultra-Simple PUT] Today:', today, 'challengeId:', challengeId, 'completed:', completed);

        if (completed) {
            // Mark challenge as completed for TODAY
            const { data, error } = await supabaseServer
                .from('challenge_completion')
                .upsert({
                    user_id: userId,
                    challenge_id: challengeId,
                    completed: true,
                    date: today,
                }, { onConflict: 'user_id,challenge_id,date' })
                .select()
                .single();

            if (error) {
                console.error('[Challenges-Ultra-Simple PUT] Error upserting completion:', error);
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            console.log('[Challenges-Ultra-Simple PUT] Successfully saved completion:', data);
            return NextResponse.json(data);
        } else {
            // Mark challenge as not completed for TODAY (delete today's completion record)
            const { error } = await supabaseServer
                .from('challenge_completion')
                .delete()
                .eq('user_id', userId)
                .eq('challenge_id', challengeId)
                .eq('date', today);

            if (error) {
                console.error('[Challenges-Ultra-Simple PUT] Error deleting completion:', error);
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            console.log('[Challenges-Ultra-Simple PUT] Successfully deleted completion');
            return NextResponse.json({ success: true });
        }

    } catch (error) {
        console.error('[Challenges-Ultra-Simple PUT] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
