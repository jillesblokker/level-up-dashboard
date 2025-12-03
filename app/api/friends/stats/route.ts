import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server-client';

export async function GET(request: Request) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const friendId = searchParams.get('friendId');

    if (!friendId) {
        return NextResponse.json({ error: 'Friend ID required' }, { status: 400 });
    }

    try {
        // 1. Verify friendship
        const { data: friendship } = await supabaseServer
            .from('friends')
            .select('*')
            .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`)
            .eq('status', 'accepted')
            .single();

        if (!friendship) {
            return NextResponse.json({ error: 'Not friends with this user' }, { status: 403 });
        }

        // 2. Fetch Character Stats (Level, Gold, XP)
        const { data: stats } = await supabaseServer
            .from('character_stats')
            .select('*')
            .eq('user_id', friendId)
            .single();

        // 3. Fetch Completion Counts
        const { count: questsCompleted } = await supabaseServer
            .from('quest_completion')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', friendId);

        const { count: challengesCompleted } = await supabaseServer
            .from('challenge_completion')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', friendId);

        const { count: milestonesCompleted } = await supabaseServer
            .from('milestone_completion')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', friendId);

        // 4. Fetch detailed breakdown (optional, can be added later)
        // For now, just total counts and main stats

        return NextResponse.json({
            stats: {
                level: stats?.level || 1,
                xp: stats?.xp || 0,
                gold: stats?.gold || 0,
                questsCompleted: questsCompleted || 0,
                challengesCompleted: challengesCompleted || 0,
                milestonesCompleted: milestonesCompleted || 0,
            }
        });

    } catch (error) {
        console.error('Error fetching friend stats:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
