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
                logger.error('[InitSpecialQuest] Error checking quest:', fetchError);
                throw new Error(`Database error checking quest: ${fetchError.message}`);
            }

            if (!existingQuest) {
                logger.debug('[InitSpecialQuest] Creating Daily Meditation quest for user:', userId);
                
                const { error: insertError } = await supabase
                    .from('quests')
                    .insert({
                        user_id: userId,
                        name: 'Daily Meditation',
                        description: 'A moment of stillness to center your spirit and prepare for the journey ahead.',
                        category: 'wellness',
                        difficulty: 'easy',
                        xp_reward: 75,
                        gold_reward: 20,
                        is_active: true,
                        is_recurring: true,
                        recurrence_interval: 'daily',
                        mandate_period: 'daily',
                        mandate_count: 1
                    });

                if (insertError) {
                    logger.error('[InitSpecialQuest] Error inserting quest:', insertError);
                    throw new Error(`Database error inserting quest: ${insertError.message}`);
                }

                return { success: true, created: true, message: 'Daily Meditation quest added to ledger.' };
            }

            return { success: true, created: false, message: 'Quest already exists.' };
        });

        if (!result.success) {
            return NextResponse.json({ 
                error: result.error || 'Authentication failed',
                details: result.error 
            }, { status: result.error?.includes('Authentication') ? 401 : 500 });
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


