import { NextRequest, NextResponse } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';
import { supabaseServer } from '@/lib/supabase/server-client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const sortByParam = searchParams.get('sortBy') || 'experience';
        const limit = parseInt(searchParams.get('limit') || '10');

        // Map parameter to database column or category
        let sortBy = sortByParam;
        if (sortByParam === 'xp') sortBy = 'experience';
        // Note: Frontend currently sends "experience", so this is just a safeguard.
        // If sortByParam is "experience", it stays "experience".

        // Handle Streaks Leaderboard
        if (sortBy === 'streak') {
            const { data, error } = await supabaseServer
                .from('streaks')
                .select(`
                    current_streak,
                    user_id,
                    character_stats:character_stats!user_id(display_name, character_name, level)
                `)
                .order('current_streak', { ascending: false })
                .limit(limit);

            if (error) {
                // If table doesn't exist or other error, return empty
                console.error('[Leaderboard] Streak error:', error);
                return NextResponse.json({ success: true, data: [] });
            }

            if (!data || data.length === 0) {
                return NextResponse.json({ success: true, data: [] });
            }

            const leaderboard = data.map((entry, index) => ({
                rank: index + 1,
                userId: entry.user_id,
                // @ts-ignore
                displayName: entry.character_stats?.display_name || entry.character_stats?.character_name || 'Anonymous Ally',
                // @ts-ignore
                title: 'Wanderer',
                // @ts-ignore
                level: entry.character_stats?.level || 1,
                value: entry.current_streak,
                formattedValue: `${entry.current_streak} Days`
            }));

            return NextResponse.json({ success: true, data: leaderboard });
        }

        // Handle Monthly Individual Quests
        if (sortBy === 'quests_monthly_individual') {
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const { data, error } = await supabaseServer
                .from('quest_completion')
                .select('user_id')
                .gte('completed_at', startOfMonth.toISOString());

            if (error) {
                console.error('Error fetching quest_completion:', error);
                return NextResponse.json({ success: true, data: [] });
            }

            if (!data || data.length === 0) {
                return NextResponse.json({ success: true, data: [] });
            }

            const counts: Record<string, number> = {};
            data.forEach(row => {
                counts[row.user_id] = (counts[row.user_id] || 0) + 1;
            });

            const topUserIds = Object.keys(counts).sort((a, b) => (counts[b] || 0) - (counts[a] || 0)).slice(0, limit);

            if (topUserIds.length === 0) return NextResponse.json({ success: true, data: [] });

            const { data: users, error: userError } = await supabaseServer
                .from('character_stats')
                .select('user_id, display_name, character_name, level')
                .in('user_id', topUserIds);

            if (userError) {
                console.error('Error fetching user stats for quests:', userError);
                // Return generic leaderboard with IDs if user fetch fails
                const fallbackLeaderboard = topUserIds.map((uid, index) => ({
                    rank: index + 1,
                    userId: uid,
                    displayName: 'Unknown Hero',
                    title: 'Adventurer',
                    level: 1,
                    value: counts[uid],
                    formattedValue: `${counts[uid]} Quests`
                }));
                return NextResponse.json({ success: true, data: fallbackLeaderboard });
            }

            const leaderboard = topUserIds.map((uid, index) => {
                const user = users?.find(u => u.user_id === uid);
                return {
                    rank: index + 1,
                    userId: uid,
                    displayName: user?.display_name || user?.character_name || 'Anonymous Hero',
                    title: 'Adventurer',
                    level: user?.level || 1,
                    value: counts[uid],
                    formattedValue: `${counts[uid]} Quests`
                };
            });

            return NextResponse.json({ success: true, data: leaderboard });
        }

        // Handle Monthly Alliance Quests
        if (sortBy === 'quests_monthly_alliance') {
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            // 1. Fetch all alliances
            const { data: alliances, error: allianceError } = await supabaseServer
                .from('alliances')
                .select('id, name, members');

            if (allianceError) {
                console.error('Error fetching alliances:', allianceError);
                return NextResponse.json({ success: true, data: [] });
            }

            // 2. Fetch all quest completions for this month
            const { data: completions, error: compError } = await supabaseServer
                .from('quest_completion')
                .select('user_id')
                .gte('completed_at', startOfMonth.toISOString());

            if (compError) {
                console.error('Error fetching quest_completion for alliances:', compError);
                return NextResponse.json({ success: true, data: [] });
            }

            // 3. Map completions to alliances
            const allianceCounts: Record<string, number> = {};
            const userToAllianceMap: Record<string, string[]> = {};

            (alliances || []).forEach((a: any) => {
                const members = (a.members || []) as string[];
                members.forEach((m: string) => {
                    if (!userToAllianceMap[m]) userToAllianceMap[m] = [];
                    userToAllianceMap[m].push(a.id);
                });
                allianceCounts[a.id] = 0; // init
            });

            // Count
            (completions || []).forEach(c => {
                const userAlliances = userToAllianceMap[c.user_id];
                if (userAlliances) {
                    userAlliances.forEach(aid => {
                        allianceCounts[aid] = (allianceCounts[aid] || 0) + 1;
                    });
                }
            });

            // Sort and Top X
            const sortedAlliances = (alliances || [])
                .map((a: any) => ({
                    ...a,
                    count: allianceCounts[a.id] || 0
                }))
                .sort((a: any, b: any) => b.count - a.count)
                .slice(0, limit);

            const leaderboard = sortedAlliances.map((a: any, index: number) => ({
                rank: index + 1,
                userId: a.id,
                displayName: a.name,
                title: `${(a.members || []).length} Members`,
                level: 0,
                value: a.count,
                formattedValue: `${a.count} Quests`
            }));

            return NextResponse.json({ success: true, data: leaderboard });
        }

        // Handle Tiles Placed Leaderboard (New Persistence)
        if (sortBy === 'tiles') {
            // Count tiles per user directly from realm_tiles
            // We use a raw query or fetch-and-count strategy.
            // Since Supabase JS client doesn't support "select user_id, count(*)" with group by easily without rpc,
            // we will fetch all tile records (only user_id col) and aggregate in memory.
            // CAUTION: This does not scale to millions of tiles. 
            // TODO: Create a Postgres VIEW or RPC 'get_tile_counts' for production scaling.

            const { data: tiles, error: tilesError } = await supabaseServer
                .from('realm_tiles')
                .select('user_id');

            if (tilesError) {
                console.error('Error fetching realm_tiles:', tilesError);
                // Return empty if table incomplete or error
                return NextResponse.json({ success: true, data: [] });
            }

            const counts: Record<string, number> = {};
            (tiles || []).forEach((t: any) => {
                counts[t.user_id] = (counts[t.user_id] || 0) + 1;
            });

            // If no tiles found at all, return empty
            if (Object.keys(counts).length === 0) {
                return NextResponse.json({ success: true, data: [] });
            }

            const topUserIds = Object.keys(counts)
                .sort((a, b) => (counts[b] || 0) - (counts[a] || 0))
                .slice(0, limit);

            const { data: users, error: userError } = await supabaseServer
                .from('character_stats')
                .select('user_id, display_name, character_name, level, title')
                .in('user_id', topUserIds);

            if (userError) {
                console.error('Error fetching user stats for leaderboard:', userError);
                return NextResponse.json({ success: true, data: [] }); // Fallback
            }

            const leaderboard = topUserIds.map((uid, index) => {
                const user = users?.find(u => u.user_id === uid);
                return {
                    rank: index + 1,
                    userId: uid,
                    displayName: user?.display_name || user?.character_name || 'Anonymous Builder',
                    title: 'Architect',
                    level: user?.level || 1,
                    value: counts[uid],
                    formattedValue: `${counts[uid]} Tiles`
                };
            });

            return NextResponse.json({ success: true, data: leaderboard });
        }

        // Handle Standard Stats (XP/Gold)
        const { data, error } = await supabaseServer
            .from('character_stats')
            .select('user_id, display_name, character_name, experience, gold, level')
            .order(sortBy, { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Leaderboard Fetch Error:', error);
            // Return empty list on valid database errors (e.g. missing columns during migration) to prevent 500s
            return NextResponse.json({ success: true, data: [] });
        }

        const leaderboard = (data || []).map((entry, index) => ({
            rank: index + 1,
            userId: entry.user_id,
            displayName: entry.display_name || entry.character_name || 'Anonymous Knight',
            title: 'Novice',
            level: entry.level || 1,
            value: sortBy === 'gold' ? (entry.gold ?? 0) : (entry.experience ?? 0),
            formattedValue: sortBy === 'gold' ? `${entry.gold ?? 0} Gold` : `${entry.experience ?? 0} XP`
        }));

        return NextResponse.json({ success: true, data: leaderboard });

    } catch (error: any) {
        console.error('Leaderboard API Error:', error);
        // Ensure we always return JSON, even on crash
        return NextResponse.json({
            error: error.message || 'Internal Server Error',
            details: error,
            success: false
        }, { status: 500 });
    }
}
