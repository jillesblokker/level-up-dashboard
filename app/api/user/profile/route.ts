import { NextRequest, NextResponse } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';

// GET /api/user/profile?userId=<id>
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        const result = await authenticatedSupabaseQuery(req, async (supabase, authUserId) => {
            // Fetch basic profile info (display name, avatar, etc.)
            // Ideally this comes from Clerk, but we might rely on 'character_stats' if it holds title/level
            // For pure user profile data (name, image), we usually rely on Clerk on the frontend.
            // However, if we need to store custom profile data, we'd query a 'profiles' table.
            // For this MVP, let's return character stats as the "profile"

            const { data: stats, error } = await supabase
                .from('character_stats')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error) throw error;

            return { stats };
        });

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 401 });
        }

        return NextResponse.json(result.data);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
