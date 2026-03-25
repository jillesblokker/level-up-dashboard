import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Use manual client creation to ensure service role access if needed, similar to other robust endpoints
const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']!;
const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY']!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 1. Dungeon Runs (Recent) & Total Wins
        const { data: runs, error: runsError } = await supabase
            .from('dungeon_runs')
            .select('*')
            .eq('user_id', userId)
            .in('status', ['completed', 'victory'])
            .order('completed_at', { ascending: false })
            .limit(5); // Last 5 runs

        const { count: totalWins, error: winCountError } = await supabase
            .from('dungeon_runs')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .in('status', ['completed', 'victory']);

        if (runsError) logger.error('Error fetching runs:', runsError);

        // 2. Journal Entries Count
        const { count: journalCount, error: journalError } = await supabase
            .from('chronicle_entries')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        if (journalError) logger.error('Error counting journals:', journalError);

        // 3. Meditation Count
        // Count from the dedicated meditations table (recorded via ZenMeditateModal)
        const { count: finalMeditationCount, error: medError } = await supabase
            .from('meditations')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        if (medError) logger.error('Error counting meditations:', medError);

        // 4. Category Streaks (User's "gains a streak by doing all challenges" requirement)
        const { data: streaks } = await supabase
            .from('streaks')
            .select('current_streak')
            .eq('user_id', userId);

        const totalCategoryStreaks = streaks?.reduce((acc, s) => acc + (s.current_streak || 0), 0) || 0;

        logger.debug(`[JourneyStats] User: ${userId}`);
        logger.debug(`[JourneyStats] Meditation Count: ${finalMeditationCount}`);
        logger.debug(`[JourneyStats] Dungeon Wins: ${totalWins}`);
        logger.debug(`[JourneyStats] Streak Tokens (Category Streaks): ${totalCategoryStreaks}`);

        return NextResponse.json({
            dungeonRuns: runs || [],
            dungeonWins: totalWins || 0,
            journalCount: journalCount || 0,
            meditationCount: finalMeditationCount || 0,
            streakTokens: totalCategoryStreaks
        });

    } catch (error) {
        logger.error("API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
