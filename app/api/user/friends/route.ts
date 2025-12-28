import { NextRequest, NextResponse } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';

// GET /api/user/friends?userId=<optional_target_id>
// If no userId param, uses authenticated user's ID
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const targetUserId = searchParams.get('userId');

        const result = await authenticatedSupabaseQuery(req, async (supabase, authUserId) => {
            const userId = targetUserId || authUserId;

            // Ensure 'friends' table exists or fetch returns empty gracefully if not (for Phase 1->3 transition)
            // Query friends where status = 'accepted'
            // We need to check both directions: user_id = userId OR friend_id = userId

            const { data: friends1, error: error1 } = await supabase
                .from('friends')
                .select('*')
                .eq('user_id', userId)
                .eq('status', 'accepted');

            const { data: friends2, error: error2 } = await supabase
                .from('friends')
                .select('*')
                .eq('friend_id', userId)
                .eq('status', 'accepted');

            if ((error1 && error1.code !== '42P01') || (error2 && error2.code !== '42P01')) {
                // Log real errors, ignore "table doesn't exist" (42P01)
                if (error1 && error1.code !== '42P01') console.error("Error/Friends1:", error1);
                if (error2 && error2.code !== '42P01') console.error("Error/Friends2:", error2);
            }

            const list1 = friends1 || [];
            const list2 = friends2 || [];

            // Combine list of friend IDs
            // For list1 (user_id=me), friend is friend_id
            // For list2 (friend_id=me), friend is user_id
            const friendIds = [
                ...list1.map(f => f.friend_id),
                ...list2.map(f => f.user_id)
            ];

            // Remove duplicates just in case
            const uniqueFriendIds = Array.from(new Set(friendIds));

            return { friends: uniqueFriendIds };
        });

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 401 });
        }

        return NextResponse.json(result.data);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
