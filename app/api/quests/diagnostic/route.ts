import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';
import { formatDate, getToday } from '@/lib/date-utils';

// Diagnostic endpoint to trace quest completion persistence issues
export async function GET(req: NextRequest) {
    try {
        const result = await authenticatedSupabaseQuery(req, async (supabase, userId) => {
            const requestTz = req.headers.get('x-timezone') || undefined;
            const today = getToday(requestTz);
            const todayUtc = new Date().toISOString().split('T')[0];

            // 1. Fetch quests from quests table
            const { data: rawQuests, error: questsError } = await supabase
                .from('quests')
                .select('id, name, category, user_id, is_active')
                .or(`user_id.is.null,user_id.eq.${userId}`);

            // 2. Fetch ALL quest_completion records
            const { data: completions, error: compError } = await supabase
                .from('quest_completion')
                .select('id, quest_id, completed, completed_at, xp_earned, gold_earned')
                .eq('user_id', userId);

            // 3. Find "Walk"-related entries
            const walkQuests = (rawQuests || []).filter((q: any) =>
                String(q.name || '').toLowerCase().includes('walk') ||
                String(q.id || '').toLowerCase().includes('walk')
            );

            const walkCompletions = (completions || []).filter((c: any) =>
                String(c.quest_id || '').toLowerCase().includes('walk')
            );

            // 4. Check today's completions
            const todayCompletions = (completions || []).filter((c: any) => {
                const cDate = formatDate(c.completed_at || '', requestTz);
                const cDateUtc = (c.completed_at || '').split('T')[0];
                return cDate === today || cDateUtc === todayUtc;
            });

            // 5. Build the SAME completion map as GET /api/quests does
            const completedQuestsMap: Record<string, boolean> = {};
            const questMetaMap = new Map<string, any>();
            (rawQuests || []).forEach((q: any) => {
                if (q.id) questMetaMap.set(String(q.id).toLowerCase(), q);
                if (q.name) questMetaMap.set(String(q.name).toLowerCase(), q);
            });

            // Group completions by quest_id
            const groups = new Map<string, any[]>();
            (completions || []).forEach((c: any) => {
                if (!groups.has(c.quest_id)) groups.set(c.quest_id, []);
                groups.get(c.quest_id)!.push(c);
            });

            groups.forEach((comps, questId) => {
                const todayComp = comps.find((c: any) => {
                    const cDate = formatDate(c.completed_at || '', requestTz);
                    const cDateUtc = (c.completed_at || '').split('T')[0];
                    return cDate === today || cDateUtc === todayUtc;
                });
                if (todayComp && todayComp.completed !== false) {
                    completedQuestsMap[questId] = true;
                }
            });

            // 6. Check which rawQuests would be marked completed
            const questResults = (rawQuests || []).map((q: any) => {
                const qId = String(q.id || '');
                const qName = String(q.name || '');
                const isCompleted = completedQuestsMap[qId] || 
                                    completedQuestsMap[qId.toLowerCase()] ||
                                    completedQuestsMap[qName] ||
                                    completedQuestsMap[qName.toLowerCase()];
                return {
                    id: q.id,
                    name: q.name,
                    category: q.category,
                    isInQuestsTable: true,
                    wouldBeCompleted: !!isCompleted,
                    completionKey: isCompleted ? (completedQuestsMap[qId] ? qId : qName) : null
                };
            });

            return {
                diagnostic: true,
                timestamp: new Date().toISOString(),
                timezone: requestTz || 'UTC (no header)',
                todayLocal: today,
                todayUtc,
                userId: userId.substring(0, 8) + '...',
                questsTable: {
                    totalCount: (rawQuests || []).length,
                    error: questsError?.message || null,
                    walkRelated: walkQuests.map((q: any) => ({ id: q.id, name: q.name, category: q.category, user_id: q.user_id ? 'yes' : 'global' })),
                },
                questCompletionTable: {
                    totalCount: (completions || []).length,
                    error: compError?.message || null,
                    todayCount: todayCompletions.length,
                    todayCompletions: todayCompletions.map((c: any) => ({
                        quest_id: c.quest_id,
                        completed: c.completed,
                        completed_at: c.completed_at,
                        localDate: formatDate(c.completed_at || '', requestTz),
                        utcDate: (c.completed_at || '').split('T')[0],
                    })),
                    walkRelated: walkCompletions.map((c: any) => ({
                        quest_id: c.quest_id,
                        completed: c.completed,
                        completed_at: c.completed_at,
                        localDate: formatDate(c.completed_at || '', requestTz),
                    })),
                },
                completionMapKeys: Object.keys(completedQuestsMap),
                questResultsSample: questResults.filter((q: any) => 
                    q.name?.toLowerCase().includes('walk') || q.wouldBeCompleted
                ).slice(0, 20),
            };
        });

        return NextResponse.json(result);
    } catch (err: any) {
        if (err.message === 'Unauthorized' || err.status === 401) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ error: err.message || 'Diagnostic failed' }, { status: 500 });
    }
}
