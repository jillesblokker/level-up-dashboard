import { supabaseServer } from '@/lib/supabase/server-client';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import logger from '@/lib/logger';

const netherlandsFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Amsterdam',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
});

function formatNetherlandsDate(input?: string | Date | null) {
    if (!input) return null;

    if (typeof input === 'string') {
        const normalized = input.includes('T') ? (input.split('T')[0] ?? input) : input;
        if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
            return normalized;
        }

        const parsed = new Date(input);
        if (!Number.isNaN(parsed.getTime())) {
            return netherlandsFormatter.format(parsed);
        }

        return normalized;
    }

    return netherlandsFormatter.format(input);
}

export async function GET() {
    try {
        // Simple Clerk authentication (same as health-check)
        const { userId } = await auth();

        if (!userId) {
            logger.error('No userId found in auth', 'Challenges API');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        logger.info(`Fetching challenges for user: ${userId}`, 'Challenges API');

        // Fetch all challenges
        const { data: allChallenges, error: challengesError } = await supabaseServer
            .from('challenges')
            .select('*');

        if (challengesError) {
            logger.error(`Error fetching challenges: ${challengesError.message}`, 'Challenges API');
            throw challengesError;
        }

        // Use Netherlands timezone for challenge display
        const today = formatNetherlandsDate(new Date()) || new Date().toISOString().slice(0, 10);
        logger.info(`Today's date: ${today}`, 'Challenges API');

        // Fetch all challenge completions for the user
        const { data: allCompletions, error: completionError } = await supabaseServer
            .from('challenge_completion')
            .select('*')
            .eq('user_id', userId);

        if (completionError) {
            logger.error(`Error fetching completions: ${completionError.message}`, 'Challenges API');
            throw completionError;
        }

        logger.info(`Found ${allChallenges?.length || 0} challenges and ${allCompletions?.length || 0} completions`, 'Challenges API');

        // Filter to only today's completions
        const todaysCompletions = (allCompletions || []).filter((completion: any) => {
            if (!completion.date) return false;
            const dbDate = String(completion.date).split('T')[0];
            const todayDate = today.split('T')[0];
            return dbDate === todayDate;
        });

        logger.info(`Found ${todaysCompletions.length} completions for today`, 'Challenges API');

        // Map completions to challenges
        const completedChallenges = new Map();
        todaysCompletions.forEach((completion: any) => {
            completedChallenges.set(completion.challenge_id, {
                completed: completion.completed,
                completionId: completion.id,
                date: completion.date
            });
        });

        // Combine challenges with completion status
        const challengesWithStatus = (allChallenges || []).map((challenge: any) => {
            const completion = completedChallenges.get(challenge.id);
            return {
                ...challenge,
                completed: completion?.completed || false,
                completionId: completion?.completionId,
                date: completion?.date,
                isNew: false
            };
        });

        logger.info(`Returning ${challengesWithStatus.length} challenges`, 'Challenges API');
        return NextResponse.json(challengesWithStatus);

    } catch (error) {
        logger.error(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown'}`, 'Challenges API');
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}

// Keep other methods (PUT, POST, PATCH) unchanged for now
// We can update them later if needed
