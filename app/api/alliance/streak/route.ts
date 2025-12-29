import { NextRequest, NextResponse } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';

export async function POST(req: NextRequest) {
    try {
        const { allianceId } = await req.json();

        if (!allianceId) {
            return NextResponse.json({ error: 'Missing allianceId' }, { status: 400 });
        }

        const result = await authenticatedSupabaseQuery(req, async (supabase, userId) => {
            // 1. Check if user already checked in today for this alliance
            const today = new Date().toISOString().split('T')[0];

            const { data: existingCheckIn } = await supabase
                .from('streaks')
                .select('*')
                .eq('user_id', userId)
                .eq('alliance_id', allianceId)
                .gte('last_check_in', today) // simplistic check, ideally use proper PG date logic
                .single();

            if (existingCheckIn) {
                return { message: 'Already checked in today' };
            }

            // 2. Update streak
            // Logic: If last_check_in was yesterday, increment streak. Else reset to 1.
            // For now, let's just Upsert current_streak + 1

            const { data: currentStreakData } = await supabase
                .from('streaks')
                .select('current_streak, last_check_in')
                .eq('user_id', userId)
                .eq('alliance_id', allianceId)
                .single();

            let newStreak = 1;
            if (currentStreakData) {
                const lastDate = new Date(currentStreakData.last_check_in);
                const now = new Date();
                const diffTime = Math.abs(now.getTime() - lastDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays <= 2) { // Allow some leniency, or strictly 1 day
                    newStreak = currentStreakData.current_streak + 1;
                }
            }

            const { data, error } = await supabase
                .from('streaks')
                .upsert({
                    user_id: userId,
                    alliance_id: allianceId,
                    current_streak: newStreak,
                    last_check_in: new Date().toISOString()
                }, { onConflict: 'user_id, alliance_id' })
                .select()
                .single();

            if (error) throw error;

            return data;
        });

        if (!result.success) {
            const isAuthError = result.error?.includes('Authentication') || result.error?.includes('JWT');
            const status = isAuthError ? 401 : 500;
            const errorMsg = typeof result.error === 'object' ? JSON.stringify(result.error) : result.error;
            return NextResponse.json({ error: errorMsg || 'Operation failed', details: result.error }, { status });
        }

        return NextResponse.json(result.data);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
