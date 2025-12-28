import { NextRequest, NextResponse } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';
import { supabaseServer } from '@/lib/supabase/server-client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const sortBy = searchParams.get('sortBy') || 'experience';
        const limit = parseInt(searchParams.get('limit') || '10');
        const period = searchParams.get('period') || 'all_time'; // future proofing

        // Validate sort
        if (!['experience', 'gold', 'streak'].includes(sortBy)) {
            return NextResponse.json({ error: 'Invalid sort parameter' }, { status: 400 });
        }

        // Handle Streaks Leaderboard (Different Table)
        if (sortBy === 'streak') {
            // We need to join with character_stats to get names, or fetch separately.
            // Supabase JOIN syntax:
            const { data, error } = await supabaseServer
                .from('streaks')
                .select(`
                    current_streak,
                    user_id,
                    character_stats:character_stats!user_id(display_name, character_name, level, title)
                `)
                .order('current_streak', { ascending: false })
                .limit(limit);

            if (error) throw error;

            const leaderboard = data.map((entry, index) => ({
                rank: index + 1,
                userId: entry.user_id,
                // @ts-ignore - Supabase types might imply array but !user_id implies single
                displayName: entry.character_stats?.display_name || entry.character_stats?.character_name || 'Anonymous Ally',
                // @ts-ignore
                title: entry.character_stats?.title || 'Wanderer',
                // @ts-ignore
                level: entry.character_stats?.level || 1,
                value: entry.current_streak,
                formattedValue: `${entry.current_streak} Days`
            }));

            return NextResponse.json({ success: true, data: leaderboard });
        }

        // Handle Standard Stats (XP/Gold)
        // Default to experience
        const { data, error } = await supabaseServer
            .from('character_stats')
            .select('user_id, display_name, character_name, experience, gold, level, title')
            .order(sortBy, { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Leaderboard Fetch Error:', error);
            // Fallback for missing columns if migration failed
            if (error.code === '42703') { // Undefined column
                return NextResponse.json({ success: true, data: [] });
            }
            throw error;
        }

        const leaderboard = data.map((entry, index) => ({
            rank: index + 1,
            userId: entry.user_id,
            displayName: entry.display_name || entry.character_name || 'Anonymous Knight',
            title: entry.title || 'Novice',
            level: entry.level || 1,
            value: sortBy === 'gold' ? entry.gold : entry.experience,
            formattedValue: sortBy === 'gold' ? `${entry.gold} Gold` : `${entry.experience} XP`
        }));

        return NextResponse.json({ success: true, data: leaderboard });

    } catch (error: any) {
        console.error('Leaderboard API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
