import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server-client';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { userId } = await getAuth(request as NextRequest);
        console.log('[Mastery History API] userId:', userId);
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const supabase = supabaseServer;

        // 1. Fetch all habits (Quests and Challenges)
        // 1. Fetch all habits (Quests and Challenges)
        // Fetch User Quests OR Global Quests (user_id is null)
        const { data: quests } = await supabase
            .from('quests')
            .select('*')
            .or(`user_id.eq.${userId},user_id.is.null`);
        // removed .eq('is_active', true) to show historical ones too, or filter in frontend
        // but for now let's just show all relevant ones


        const { data: challenges } = await supabase
            .from('challenges')
            .select('*');

        // 2. Fetch completions for the last 7 days + current month
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const startOfMonth = new Date();
        startOfMonth.setDate(1);

        const { data: questCompletions } = await supabase
            .from('quest_completion')
            .select('*')
            .eq('user_id', userId)
            .gte('completed_at', startOfMonth.toISOString());

        const { data: challengeCompletions } = await supabase
            .from('challenge_completion')
            .select('*')
            .eq('user_id', userId)
            .gte('date', startOfMonth.toISOString().split('T')[0]);

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
    const now = new Date();
    const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam' }).format(now);

    // Get last 7 days grid
    const grid = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam' }).format(d);

        const isDone = completions.some(c => {
            const cDate = c.completed_at || c.date;
            const cDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam' }).format(new Date(cDate));
            return (c.quest_id === item.id || c.challenge_id === item.id) && cDateStr === dStr && (c.completed !== false);
        });
        grid.push(isDone);
    }

    // Filter completions for this specific habit
    const habitCompletions = completions.filter(c => (c.quest_id === item.id || c.challenge_id === item.id) && (c.completed !== false));

    // Monthly stats
    const monthCompletionsCount = habitCompletions.length;

    // Target calculation (estimated monthly target)
    let monthlyTarget = item.mandate_count || 1;
    if (item.mandate_period === 'daily') monthlyTarget = 30;
    else if (item.mandate_period === 'weekly') monthlyTarget = (item.mandate_count || 1) * 4;

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
        grid,
        completions: habitCompletions.map(c => ({ completed_at: c.completed_at || c.date })),
        stats: {
            monthly: monthCompletionsCount,
            fulfillment
        }
    };
}
