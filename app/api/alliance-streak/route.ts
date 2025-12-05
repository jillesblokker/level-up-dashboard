import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { AllianceStreakManager } from '@/lib/alliance-streak-manager';

const supabase = createClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['SUPABASE_SERVICE_ROLE_KEY']!
);

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const streakManager = new AllianceStreakManager(supabase);
        const streak = await streakManager.getStreak(userId);

        return NextResponse.json(streak);
    } catch (error) {
        console.error('Error fetching alliance streak:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
