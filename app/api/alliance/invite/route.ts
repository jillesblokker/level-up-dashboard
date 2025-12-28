import { NextRequest, NextResponse } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { allianceId, friendId } = await req.json();

        if (!allianceId || !friendId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const result = await authenticatedSupabaseQuery(req, async (supabase, userId) => {
            // 1. Fetch Requesting User & Alliance to verify permission (must be a member)
            const { data: alliance, error: fetchError } = await supabase
                .from('alliances')
                .select('*')
                .eq('id', allianceId)
                .single();

            if (fetchError || !alliance) {
                throw new Error("Alliance not found");
            }

            const members = (alliance.members as string[]) || [];

            if (!members.includes(userId)) {
                throw new Error("You are not a member of this alliance");
            }

            if (members.includes(friendId)) {
                return { message: "User is already in the alliance", success: true };
            }

            // 2. Add friend
            const updatedMembers = [...members, friendId];

            const { data, error: updateError } = await supabase
                .from('alliances')
                .update({ members: updatedMembers, updated_at: new Date().toISOString() })
                .eq('id', allianceId)
                .select();

            if (updateError) throw updateError;
            return { success: true, data };
        });

        // Check if authentication or database query failed
        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 401 });
        }

        // Return the data explicitly
        return NextResponse.json(result.data);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
