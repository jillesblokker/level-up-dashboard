import { NextRequest, NextResponse } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        const result = await authenticatedSupabaseQuery(req, async (supabase, authUserId) => {
            // Fetch alliances the user is part of
            // Assuming a simple 'alliances' table with 'members' JSONB or array, or a join table
            // For Phase 3 MVP, let's assume 'alliances' table has 'members' array of user_ids

            const { data, error } = await supabase
                .from('alliances')
                .select('*')
                .contains('members', [userId || authUserId]);

            if (error && error.code === '42P01') { // Table doesn't exist yet
                return [];
            }

            return data || [];
        });

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 401 });
        }

        return NextResponse.json(result.data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    // Create new alliance
    return NextResponse.json({ message: "Not implemented yet" })
}
