import { NextRequest, NextResponse } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';
import { auth, currentUser } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

// Helper to verify admin status
async function isAdmin() {
    const user = await currentUser();
    if (!user) return false;

    // Replace with your actual admin logic
    // For now, we check a specific email or metadata
    const adminEmail = process.env.ADMIN_EMAIL || 'jillesblokker@gmail.com'; // Fallback to assumed email or ensure ENV is set
    const userEmail = user.emailAddresses[0]?.emailAddress;

    // Check strict equality
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

    return await authenticatedSupabaseQuery(req, async (supabase) => {
        // Search by username or email (via user_preferences or just character_stats user_id joining?)
        // Since we store profile data in 'user_preferences' (display_name), let's search that.

        // Note: Searching auth.users is hard with RLS. We usually search our public 'users' or 'user_preferences' table.
        // 'user_preferences' has 'display_name'.

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
}

// Update User Stats
export async function PUT(req: NextRequest) {
    if (!await isAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { userId, updates } = body; // updates = { gold: 100, xp: 500 }

    return await authenticatedSupabaseQuery(req, async (supabase) => {
        const { data, error } = await supabase
            .from('character_stats')
            .update(updates)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;
        return { success: true, stats: data };
    });
}
