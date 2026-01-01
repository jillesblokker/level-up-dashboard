import { NextRequest, NextResponse } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';
import { currentUser } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

// Helper to verify admin status
async function isAdmin() {
    const user = await currentUser();
    if (!user) return false;

    // Replace with your actual admin logic
    const adminEmail = process.env['ADMIN_EMAIL'] || 'jillesblokker@gmail.com';
    const userEmail = user.emailAddresses[0]?.emailAddress;

    return userEmail === adminEmail;
}

// Search Users
export async function GET(req: NextRequest) {
    if (!await isAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');

    if (!query || query.length < 3) {
        return NextResponse.json({ users: [] });
    }

    const result = await authenticatedSupabaseQuery(req, async (supabase) => {
        const { data, error } = await supabase
            .from('user_preferences')
            .select('user_id, display_name')
            .ilike('display_name', `%${query}%`)
            .limit(10);

        if (error) throw error;

        // Fetch stats for these users
        const usersWithStats = await Promise.all(data.map(async (u: any) => {
            const { data: stats } = await supabase
                .from('character_stats')
                .select('*')
                .eq('user_id', u.user_id)
                .single();

            return { ...u, stats };
        }));

        return { users: usersWithStats };
    });

    if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result.data);
}

// Update User Stats
export async function PUT(req: NextRequest) {
    if (!await isAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { userId, updates } = body;

    const result = await authenticatedSupabaseQuery(req, async (supabase) => {
        const { data, error } = await supabase
            .from('character_stats')
            .update(updates)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;
        return { success: true, stats: data };
    });

    if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result.data);
}
