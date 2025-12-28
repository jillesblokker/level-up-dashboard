
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server-client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const limit = 10;

        // Fetch recent quest completions
        const { data: completions, error } = await supabaseServer
            .from('quest_completion')
            .select(`
                completion_id,
                user_id,
                quest_id,
                completed_at,
                character_stats:character_stats!user_id(display_name, character_name, title)
            `)
            .order('completed_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Activity Feed Error:', error);
            return NextResponse.json({ success: true, data: [] });
        }

        // We also need quest names. Since quest_id is in the completion table, 
        // we might join quest table IF relation exists, or just fetch quests.
        // Assuming 'quests' table exists and has 'id', 'name'.

        // Fetch quest details for these IDs
        const questIds = [...new Set(completions?.map(c => c.quest_id) || [])];
        let questMap: Record<string, string> = {};

        if (questIds.length > 0) {
            const { data: quests, error: questError } = await supabaseServer
                .from('quests')
                .select('id, name')
                .in('id', questIds);

            if (!questError && quests) {
                quests.forEach((q: any) => {
                    questMap[q.id] = q.name;
                });
            }
        }

        const activity = completions?.map((c: any) => {
            // @ts-ignore
            const user = c.character_stats;
            const userName = user?.display_name || user?.character_name || 'Anonymous Hero';
            const questName = questMap[c.quest_id] || 'Unknown Quest';

            return {
                id: c.completion_id,
                type: 'quest_complete',
                message: `${userName} completed ${questName}`,
                timestamp: c.completed_at,
                user: userName,
                details: questName
            };
        }) || [];

        return NextResponse.json({ success: true, data: activity });

    } catch (error: any) {
        console.error('Activity Feed Catch Error:', error);
        return NextResponse.json({ success: true, data: [] });
    }
}
