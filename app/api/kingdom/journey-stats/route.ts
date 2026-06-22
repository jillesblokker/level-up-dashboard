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

        // Run queries concurrently to prevent timeouts on Vercel Edge
        const [
            runsResult,
            winsResult,
            journalResult,
            medResult,
            streaksResult
        ] = await Promise.all([
            // 1. Dungeon Runs (Recent)
            supabase.from('dungeon_runs')
                .select('*')
                .eq('user_id', userId)
                .in('status', ['completed', 'victory'])
                .order('completed_at', { ascending: false })
                .limit(5),
                
            // 2. Total Wins
            supabase.from('dungeon_runs')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .in('status', ['completed', 'victory']),
                
            // 3. Journal Entries Count
            supabase.from('chronicle_entries')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId),
                
            // 4. Meditation Count
            supabase.from('meditations')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId),
                
            // 5. Category Streaks
            supabase.from('streaks')
                .select('current_streak')
                .eq('user_id', userId)
        ]);

        const runs = runsResult.data;
        const runsError = runsResult.error;
        const totalWins = winsResult.count;
        const winCountError = winsResult.error;
        const journalCount = journalResult.count;
        const journalError = journalResult.error;
        const finalMeditationCount = medResult.count;
        const medError = medResult.error;
        const streaks = streaksResult.data;

        if (runsError) logger.error('Error fetching runs:', runsError);
        if (journalError) logger.error('Error counting journals:', journalError);
        if (medError) logger.error('Error counting meditations:', medError);

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
