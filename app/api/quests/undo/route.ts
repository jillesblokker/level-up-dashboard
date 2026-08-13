import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';
import { formatDate, getToday } from '@/lib/date-utils';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { questId } = body;

        if (!questId) {
            return NextResponse.json({ error: 'Quest ID is required' }, { status: 400 });
        }

        const requestTz = request.headers.get('x-timezone') || undefined;
        const todayStr = getToday(requestTz);

        const result = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
            // Fetch quest definition to check UUID / name
            const { data: quest } = await supabase
                .from('quests')
                .select('*')
                .eq('id', questId)
                .maybeSingle();

            const possibleQuestIds = Array.from(new Set([
                String(questId),
                String(quest?.id || ''),
                String(quest?.name || ''),
                String(questId).toLowerCase(),
                String(quest?.name || '').toLowerCase()
            ].filter(Boolean)));

            // Fetch completions for this user
            const { data: allCompletions, error: fetchError } = await supabase
                .from('quest_completion')
                .select('*')
                .eq('user_id', userId)
                .order('completed_at', { ascending: false });

            if (fetchError) throw fetchError;

            const matchingCompletions = (allCompletions || []).filter(c =>
                possibleQuestIds.includes(String(c.quest_id)) ||
                possibleQuestIds.includes(String(c.quest_id).toLowerCase())
            );

            if (matchingCompletions.length === 0) {
                logger.warn('[QUEST-UNDO] No completion record found matching quest identifiers:', { questId, possibleQuestIds, userId });
                return { success: true, message: 'No completion record found to undo', undone: false };
            }

            const latestCompletion = matchingCompletions.find(c => {
                if (!c.completed_at && !c.created_at) return false;
                const cDate = formatDate(c.completed_at || c.created_at, requestTz);
                const cDateUtc = new Date(c.completed_at || c.created_at).toISOString().split('T')[0];
                const todayUtc = new Date().toISOString().split('T')[0];
                return cDate === todayStr || cDateUtc === todayUtc;
            }) || matchingCompletions[0];

            const xpEarned = latestCompletion?.xp_earned || 0;
            const goldEarned = latestCompletion?.gold_earned || 0;

            // Delete the completion record from database
            const { error: deleteError } = await supabase
                .from('quest_completion')
                .delete()
                .eq('id', latestCompletion.id);

            if (deleteError) {
                logger.error('[QUEST-UNDO] Error deleting quest completion from database:', deleteError);
                throw deleteError;
            }

            logger.info('[QUEST-UNDO] Successfully deleted completion record from Supabase via /api/quests/undo', {
                questId,
                completionId: latestCompletion.id,
                userId
            });

            // Deduct rewards from character stats if applicable
            const { data: currentStats } = await supabase
                .from('character_stats')
                .select('*')
                .eq('user_id', userId)
                .maybeSingle();

            if (currentStats) {
                const newXP = Math.max(0, (currentStats.experience || 0) - xpEarned);
                const newGold = Math.max(0, (currentStats.gold || 0) - goldEarned);

                await supabase
                    .from('character_stats')
                    .update({
                        experience: newXP,
                        gold: newGold,
                        updated_at: new Date().toISOString()
                    })
                    .eq('user_id', userId);
            }

            return {
                success: true,
                undone: true,
                questId,
                deletedCompletionId: latestCompletion.id,
                revertedRewards: { xp: xpEarned, gold: goldEarned }
            };
        });

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 401 });
        }

        return NextResponse.json(result.data);
    } catch (error: any) {
        logger.error('Error in /api/quests/undo:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
