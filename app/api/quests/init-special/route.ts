import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server-client';
import { logger } from '@/lib/logger';

const supabase = supabaseServer;

export async function POST(request: Request) {
    try {
        const { userId } = await getAuth(request as NextRequest);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { type } = body;

        if (type === 'meditation') {
            // Check if "Daily Meditation" exists for this user
            const { data: existingQuest, error: fetchError } = await supabase
                .from('quests')
                .select('id')
                .eq('user_id', userId)
                .eq('name', 'Daily Meditation')
                .maybeSingle();

            if (fetchError) {
                logger.error('[InitSpecialQuest] Error checking quest:', fetchError);
                return NextResponse.json({ error: fetchError.message }, { status: 500 });
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
                    return NextResponse.json({ error: insertError.message }, { status: 500 });
                }

                return NextResponse.json({ success: true, created: true, message: 'Daily Meditation quest added to ledger.' });
            }

            return NextResponse.json({ success: true, created: false, message: 'Quest already exists.' });
        }

        return NextResponse.json({ error: 'Invalid special quest type' }, { status: 400 });

    } catch (error) {
        logger.error('[InitSpecialQuest] Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
