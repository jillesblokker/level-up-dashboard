import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server-client';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { userId } = await getAuth(request as NextRequest);

        // Parse date param
        const url = new URL(request.url);
        const dateParam = url.searchParams.get('date');
        const referenceDate = dateParam ? new Date(dateParam) : new Date();

        console.log('[Mastery History API] userId:', userId, 'Date:', referenceDate.toISOString());

        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const supabase = supabaseServer;

        // 1. Fetch all habits (Quests and Challenges)
        // Fetch User Quests OR Global Quests (user_id is null)
        const { data: quests } = await supabase
            .from('quests')
            .select('*')
            .or(`user_id.eq.${userId},user_id.is.null`);

        const { data: challenges } = await supabase
            .from('challenges')
            .select('*');

        // 2. Fetch completions for the selected month
        const startOfMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
        const startOfNextMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 1);

        // ISO Strings for query
        const startStr = startOfMonth.toISOString();
        const endStr = startOfNextMonth.toISOString();

        const { data: questCompletions } = await supabase
            .from('quest_completion')
            .select('*')
            .eq('user_id', userId)
            .gte('completed_at', startStr)
            .lt('completed_at', endStr);

        const { data: challengeCompletions } = await supabase
            .from('challenge_completion')
            .select('*')
            .eq('user_id', userId)
            .gte('date', startStr)
            .lt('date', endStr);

        // 3. Process into a unified history format
        const habits = [
            ...(quests || []).map(q => processHabit(q, 'quest', questCompletions || [])),
            ...(challenges || []).map(c => processHabit(c, 'challenge', challengeCompletions || []))
        ];

        return NextResponse.json({ habits });

    } catch (error) {
        console.error('[Mastery API] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

function processHabit(item: any, type: 'quest' | 'challenge', completions: any[]) {
    // Note: Grid generation is now handled on frontend, but we calculate stats here

    // Filter completions for this specific habit (already filtered by month in SQL)
    const habitCompletions = completions.filter(c => (c.quest_id === item.id || c.challenge_id === item.id) && (c.completed !== false));

    // Monthly stats
    const monthCompletionsCount = habitCompletions.length;

    // Target calculation (estimated monthly target)
    let monthlyTarget = item.mandate_count || 1;
    if (item.mandate_period === 'daily') monthlyTarget = 30; // approx
    else if (item.mandate_period === 'weekly') monthlyTarget = (item.mandate_count || 1) * 4;

    // Cap at 100%
    const fulfillment = monthlyTarget > 0 ? Math.min(100, Math.round((monthCompletionsCount / monthlyTarget) * 100)) : 0;

    return {
        id: item.id,
        name: item.name,
        category: item.category,
        type,
        mandate: {
            period: item.mandate_period || 'daily',
            count: item.mandate_count || 1
        },
        stats: { // explicitly structure as stats to match frontend expectation
            monthly: monthCompletionsCount,
            fulfillment: fulfillment
        },
        grid: [], // Frontend handles this dynamically using raw completions
        completions: habitCompletions.map(c => ({ completed_at: c.completed_at || c.date })),
        habitType: type // Ensure this is set for frontend filter logic
    };
}
