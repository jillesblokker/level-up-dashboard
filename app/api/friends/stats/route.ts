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
        // 1. Verify friendship (skip if fetching own stats)
        if (friendId !== userId) {
            const { data: friendship } = await supabaseServer
                .from('friends')
                .select('*')
                .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`)
                .eq('status', 'accepted')
                .single();

            if (!friendship) {
                return NextResponse.json({ error: 'Not friends with this user' }, { status: 403 });
            }
        }

        // 2. Fetch Character Stats (Level, Gold, XP)
        const { data: stats } = await supabaseServer
            .from('character_stats')
            .select('*')
            .eq('user_id', friendId)
            .single();

        // 3. Fetch Detailed Breakdowns

        // Quests
        const { data: quests } = await supabaseServer
            .from('quests')
            .select('id, category')
            .or(`user_id.is.null,user_id.eq.${friendId}`);

        const { data: questCompletions } = await supabaseServer
            .from('quest_completion')
            .select('quest_id')
            .eq('user_id', friendId);

        // Challenges
        const { data: challenges } = await supabaseServer
            .from('challenges')
            .select('id, category')
            .or(`user_id.is.null,user_id.eq.${friendId}`);

        const { data: challengeCompletions } = await supabaseServer
            .from('challenge_completion')
            .select('challenge_id')
            .eq('user_id', friendId);

        // Milestones
        const { data: milestones } = await supabaseServer
            .from('milestones')
            .select('id, category')
            .or(`user_id.is.null,user_id.eq.${friendId}`);

        const { data: milestoneCompletions } = await supabaseServer
            .from('milestone_completion')
            .select('milestone_id')
            .eq('user_id', friendId);

        // Helper to calculate breakdown
        const calculateBreakdown = (items: any[], completions: any[], idField: string) => {
            const completedIds = new Set(completions?.map(c => c[idField]) || []);
            const breakdown: Record<string, number> = {};
            let total = 0;

            items?.forEach(item => {
                if (completedIds.has(item.id)) {
                    breakdown[item.category] = (breakdown[item.category] || 0) + 1;
                    total++;
                }
            });

            return { total, breakdown };
        };

        const questStats = calculateBreakdown(quests || [], questCompletions || [], 'quest_id');
        const challengeStats = calculateBreakdown(challenges || [], challengeCompletions || [], 'challenge_id');
        const milestoneStats = calculateBreakdown(milestones || [], milestoneCompletions || [], 'milestone_id');

        return NextResponse.json({
            stats: {
                level: stats?.level || 1,
                xp: stats?.xp || 0,
                gold: stats?.gold || 0,
                quests: questStats,
                challenges: challengeStats,
                milestones: milestoneStats
            }
        });

    } catch (error) {
        console.error('Error fetching friend stats:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
