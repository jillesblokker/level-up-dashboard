import { NextRequest, NextResponse } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        const result = await authenticatedSupabaseQuery(req, async (supabase, authUserId) => {
            const currentUserId = userId || authUserId;

            // Fetch alliances
            const { data: alliances, error } = await supabase
                .from('alliances')
                .select('*')
                .contains('members', [currentUserId]);

            if (error && error.code === '42P01') return [];
            if (!alliances || alliances.length === 0) return [];

            // Fetch streaks for these alliances
            const { data: streaks } = await supabase
                .from('streaks')
                .select('*')
                .eq('user_id', currentUserId)
                .in('alliance_id', alliances.map(a => a.id));

            // Merge streak info
            const today = new Date().toISOString().split('T')[0];

            // Fetch member stats for "Alliance Weekly Goals"
            const allMemberIds = Array.from(new Set(alliances.flatMap(a => a.members)));
            const { data: memberStats } = await supabase
                .from('character_stats')
                .select('user_id, level, experience')
                .in('user_id', allMemberIds);

            return alliances.map(alliance => {
                const streakData = streaks?.find(s => s.alliance_id === alliance.id);
                const lastCheckIn = streakData?.last_check_in ? new Date(streakData.last_check_in).toISOString().split('T')[0] : null;
                const isCheckedInToday = lastCheckIn === today;

                // Calculate Alliance Aggregates
                const allianceMembers = memberStats?.filter(s => alliance.members.includes(s.user_id)) || [];
                const totalLevel = allianceMembers.reduce((sum, m) => sum + (m.level || 1), 0);
                const totalXp = allianceMembers.reduce((sum, m) => sum + (m.experience || 0), 0);

                return {
                    ...alliance,
                    myStreak: {
                        current: streakData?.current_streak || 0,
                        checkedInToday: isCheckedInToday,
                        lastCheckIn: streakData?.last_check_in
                    },
                    stats: {
                        totalLevel,
                        totalXp,
                        memberCount: alliance.members.length
                    }
                };
            });
        });

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 401 });
        }

        return NextResponse.json(result.data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { name, description } = await req.json();

        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        const result = await authenticatedSupabaseQuery(req, async (supabase, userId) => {
            // Check if user is already in an alliance? (Optional: allow multiple)

            const newAlliance = {
                name,
                description,
                created_by: userId,
                members: [userId],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('alliances')
                .insert(newAlliance)
                .select()
                .single();

            if (error) throw error;
            return data;
        });

        if (!result.success) {
            const isAuthError = result.error?.includes('Authentication') || result.error?.includes('JWT');
            const status = isAuthError ? 401 : 500;
            const errorMsg = typeof result.error === 'object' ? JSON.stringify(result.error) : result.error;
            return NextResponse.json({ error: errorMsg || 'Operation failed', details: result.error }, { status });
        }

        return NextResponse.json({ success: true, alliance: result.data });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
