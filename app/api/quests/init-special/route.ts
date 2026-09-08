import { NextResponse, NextRequest } from 'next/server';
import { logger } from '@/lib/logger';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';

export async function POST(request: NextRequest) {
    try {
        let body;
        try {
            body = await request.json();
        } catch (e) {
            logger.error('[InitSpecialQuest] Failed to parse request body');
            return NextResponse.json({ error: 'Invalid or missing request body' }, { status: 400 });
        }
        
        const { type } = body;

        if (type !== 'meditation') {
            return NextResponse.json({ error: 'Invalid special quest type' }, { status: 400 });
        }

        const result = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
            // Check if "Daily Meditation" exists for this user
            const { data: existingQuest, error: fetchError } = await supabase
                .from('quests')
                .select('id')
                .eq('user_id', userId)
                .eq('name', 'Daily Meditation')
                .maybeSingle();

            if (fetchError) {
                logger.warn('[InitSpecialQuest] Non-fatal error checking quest:', fetchError.message);
                return { success: false, created: false, message: fetchError.message };
            }

            if (!existingQuest) {
                logger.debug('[InitSpecialQuest] Creating Daily Meditation quest for user:', userId);
                
                // Base payload with guaranteed columns across all schema migrations
                const baseQuest = {
                    user_id: userId,
                    name: 'Daily Meditation',
                    description: 'A moment of stillness to center your spirit and prepare for the journey ahead.',
                    category: 'wellness',
                    difficulty: 'easy',
                    xp_reward: 75,
                    gold_reward: 20,
                    is_active: true
                };

                // Try inserting with recurrence metadata first
                const fullQuest = {
                    ...baseQuest,
                    is_recurring: true,
                    recurrence_interval: 'daily',
                    mandate_period: 'daily',
                    mandate_count: 1
                };

                let insertError = null;
                const { error: fullError } = await supabase.from('quests').insert(fullQuest);

                if (fullError) {
                    logger.debug('[InitSpecialQuest] Full insert failed, falling back to base columns:', fullError.message);
                    const { error: baseError } = await supabase.from('quests').insert(baseQuest);
                    if (baseError) {
                        insertError = baseError;
                    }
                }

                if (insertError) {
                    logger.warn('[InitSpecialQuest] Error inserting quest:', insertError.message);
                    return { success: false, created: false, message: insertError.message };
                }

                return { success: true, created: true, message: 'Daily Meditation quest added to ledger.' };
            }

            return { success: true, created: false, message: 'Quest already exists.' };
        });

        if (!result.success) {
            const errStr = (result.error || '').toLowerCase();
            const isAuth = !result.error || errStr.includes('auth') || errStr.includes('session') || errStr.includes('unauthorized') || errStr.includes('valid session');
            return NextResponse.json({ 
                error: result.error || 'Authentication required',
                details: result.error 
            }, { status: isAuth ? 401 : 500 });
        }

        return NextResponse.json(result.data);

    } catch (error: any) {
        logger.error('[InitSpecialQuest] Unexpected error:', error);
        return NextResponse.json({ 
            error: 'Internal server error',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}


