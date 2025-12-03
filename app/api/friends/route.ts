import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server-client';

// GET /api/friends - List all friends (accepted and pending)
export async function GET(request: Request) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Fetch all friendship records where the user is involved
        const { data: friendships, error } = await supabaseServer
            .from('friends')
            .select('*')
            .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

        if (error) {
            console.error('Error fetching friends:', error);
            console.error('Error details:', JSON.stringify(error, null, 2));
            return NextResponse.json({
                error: 'Failed to fetch friends',
                details: error.message,
                hint: error.hint,
                code: error.code
            }, { status: 500 });
        }

        // Extract friend IDs
        const friendIds = friendships.map(f =>
            f.user_id === userId ? f.friend_id : f.user_id
        );

        if (friendIds.length === 0) {
            return NextResponse.json({ friends: [], requests: [] });
        }

        // Fetch user details from Clerk
        const clerk = await clerkClient();
        const users = await clerk.users.getUserList({
            userId: friendIds,
            limit: 100,
        });

        // Map users to a lookup map
        const userMap = new Map(users.data.map(u => [u.id, u]));

        // Format the response
        const friends = [];
        const requests = [];

        for (const f of friendships) {
            const isSender = f.user_id === userId;
            const otherId = isSender ? f.friend_id : f.user_id;
            const otherUser = userMap.get(otherId);

            if (!otherUser) continue;

            const friendData = {
                id: f.id, // Friendship ID
                friendId: otherId,
                username: otherUser.username || otherUser.firstName || otherUser.emailAddresses[0]?.emailAddress?.split('@')[0] || 'Unknown',
                imageUrl: otherUser.imageUrl,
                status: f.status,
                isSender, // To know if I sent the request or received it
                createdAt: f.created_at,
            };

            if (f.status === 'accepted') {
                friends.push(friendData);
            } else if (f.status === 'pending') {
                requests.push(friendData);
            }
        }

        return NextResponse.json({ friends, requests });

    } catch (error) {
        console.error('Unexpected error fetching friends:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/friends - Send a friend request
export async function POST(request: Request) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { targetUserId } = await request.json();

        if (!targetUserId || targetUserId === userId) {
            return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
        }

        // Check if friendship already exists
        const { data: existing } = await supabaseServer
            .from('friends')
            .select('*')
            .or(`and(user_id.eq.${userId},friend_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},friend_id.eq.${userId})`)
            .single();

        if (existing) {
            return NextResponse.json({ error: 'Friendship already exists or is pending' }, { status: 409 });
        }

        // Create friendship record
        const { data: friendship, error } = await supabaseServer
            .from('friends')
            .insert({
                user_id: userId,
                friend_id: targetUserId,
                status: 'pending'
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating friend request:', error);
            console.error('Error details:', JSON.stringify(error, null, 2));
            return NextResponse.json({
                error: 'Failed to send friend request',
                details: error.message,
                hint: error.hint,
                code: error.code
            }, { status: 500 });
        }

        // Create notification for the recipient
        // Fetch sender details for the notification
        const clerk = await clerkClient();
        const sender = await clerk.users.getUser(userId);
        const senderName = sender.username || sender.firstName || 'Someone';

        await supabaseServer
            .from('notifications')
            .insert({
                user_id: targetUserId,
                type: 'friend_request',
                data: {
                    senderId: userId,
                    senderName: senderName,
                    friendshipId: friendship.id
                }
            });

        return NextResponse.json({ success: true, friendship });

    } catch (error) {
        console.error('Unexpected error sending friend request:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
