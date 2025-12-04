import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server-client';

// PUT /api/friends/[id] - Respond to friend request (Accept/Reject)
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: friendshipId } = await params;
    const { action } = await request.json(); // 'accept' or 'reject'

    if (!['accept', 'reject'].includes(action)) {
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    try {
        // Fetch the friendship to verify ownership and status
        const { data: friendship, error: fetchError } = await supabaseServer
            .from('friends')
            .select('*')
            .eq('id', friendshipId)
            .single();

        if (fetchError || !friendship) {
            return NextResponse.json({ error: 'Friendship not found' }, { status: 404 });
        }

        // Only the recipient can accept/reject
        if (friendship.friend_id !== userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        if (friendship.status !== 'pending') {
            return NextResponse.json({ error: 'Friend request is not pending' }, { status: 400 });
        }

        if (action === 'reject') {
            // Delete the record
            await supabaseServer.from('friends').delete().eq('id', friendshipId);
            return NextResponse.json({ success: true, status: 'rejected' });
        }

        // Accept the request
        const { error: updateError } = await supabaseServer
            .from('friends')
            .update({ status: 'accepted', updated_at: new Date().toISOString() })
            .eq('id', friendshipId);

        if (updateError) {
            return NextResponse.json({ error: 'Failed to update friendship' }, { status: 500 });
        }

        // Create notification for the sender (that their request was accepted)
        const clerk = await clerkClient();
        const recipient = await clerk.users.getUser(userId);
        const recipientName = recipient.username || recipient.firstName || 'Someone';

        await supabaseServer
            .from('notifications')
            .insert({
                user_id: friendship.user_id, // The original sender
                type: 'friend_request_accepted',
                data: {
                    accepterId: userId,
                    accepterName: recipientName,
                    friendshipId: friendshipId
                }
            });

        // Check Achievements for both users
        try {
            const { AchievementManager } = await import('@/lib/achievement-manager');
            const achievementManager = new AchievementManager(supabaseServer);

            // Count friends for recipient (current user)
            const { count: recipientFriendCount } = await supabaseServer
                .from('friends')
                .select('*', { count: 'exact', head: true })
                .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
                .eq('status', 'accepted');

            // Count friends for sender
            const { count: senderFriendCount } = await supabaseServer
                .from('friends')
                .select('*', { count: 'exact', head: true })
                .or(`user_id.eq.${friendship.user_id},friend_id.eq.${friendship.user_id}`)
                .eq('status', 'accepted');

            // Check recipient achievements
            if (recipientFriendCount) {
                await achievementManager.checkAndUnlock(userId, 'first_friend', recipientFriendCount);
                await achievementManager.checkAndUnlock(userId, 'five_friends', recipientFriendCount);
                await achievementManager.checkAndUnlock(userId, 'ten_friends', recipientFriendCount);
            }

            // Check sender achievements
            if (senderFriendCount) {
                await achievementManager.checkAndUnlock(friendship.user_id, 'first_friend', senderFriendCount);
                await achievementManager.checkAndUnlock(friendship.user_id, 'five_friends', senderFriendCount);
                await achievementManager.checkAndUnlock(friendship.user_id, 'ten_friends', senderFriendCount);
            }
        } catch (achError) {
            console.error('Error checking achievements:', achError);
            // Don't fail the request if achievements fail
        }

        return NextResponse.json({ success: true, status: 'accepted' });

    } catch (error) {
        console.error('Error responding to friend request:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/friends/[id] - Unfriend
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: friendshipId } = await params;

    try {
        // Verify ownership
        const { data: friendship, error: fetchError } = await supabaseServer
            .from('friends')
            .select('*')
            .eq('id', friendshipId)
            .single();

        if (fetchError || !friendship) {
            return NextResponse.json({ error: 'Friendship not found' }, { status: 404 });
        }

        // Either party can delete
        if (friendship.user_id !== userId && friendship.friend_id !== userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { error: deleteError } = await supabaseServer
            .from('friends')
            .delete()
            .eq('id', friendshipId);

        if (deleteError) {
            return NextResponse.json({ error: 'Failed to remove friend' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error removing friend:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
