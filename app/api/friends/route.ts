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

        // Fetch character stats for titles and last_seen
        const { data: statsData } = await supabaseServer
            .from('character_stats')
            .select('user_id, title, last_seen, level, xp')
            .in('user_id', friendIds);

        const statsMap = new Map(statsData?.map(s => [s.user_id, s]) || []);

        // Fetch Quest Completion Counts
        const { data: questData } = await supabaseServer
            .from('quest_completion')
            .select('user_id')
            .in('user_id', friendIds);

        const questCounts = new Map<string, number>();
        questData?.forEach(q => {
            questCounts.set(q.user_id, (questCounts.get(q.user_id) || 0) + 1);
        });

        // Fetch "Challenges" (Hard Quests)
        const { data: challengeData } = await supabaseServer
            .from('quest_completion')
            .select('user_id, quests!inner(difficulty)')
            .in('user_id', friendIds)
            .eq('quests.difficulty', 'hard');

        const challengeCounts = new Map<string, number>();
        challengeData?.forEach((c: any) => {
            challengeCounts.set(c.user_id, (challengeCounts.get(c.user_id) || 0) + 1);
        });

        // Fetch Streaks and Alliances
        const { data: streakData } = await supabaseServer
            .from('streaks')
            .select('user_id, current_streak, alliance_id')
            .in('user_id', friendIds);

        const streakMap = new Map<string, number>();
        const allianceIdMap = new Map<string, string>();
        const allianceIds = new Set<string>();

        streakData?.forEach(s => {
            if ((s.current_streak || 0) >= (streakMap.get(s.user_id) || 0)) {
                streakMap.set(s.user_id, s.current_streak);
                // Specifically look for a valid alliance ID to link
                if (s.alliance_id) {
                    allianceIdMap.set(s.user_id, s.alliance_id);
                    allianceIds.add(s.alliance_id);
                }
            }
        });

        // Fetch Alliance Names
        const allianceNameMap = new Map<string, string>();
        if (allianceIds.size > 0) {
            const { data: allianceData } = await supabaseServer
                .from('alliances')
                .select('id, name')
                .in('id', Array.from(allianceIds));

            allianceData?.forEach(a => allianceNameMap.set(a.id, a.name));
        }

        // Fetch Shared Gifts (Sent or Received involving the current user)
        const { data: giftData } = await supabaseServer
            .from('gifts')
            .select('sender_id, recipient_id')
            .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`);

        const giftCounts = new Map<string, number>();
        giftData?.forEach(g => {
            const friendId = g.sender_id === userId ? g.recipient_id : g.sender_id;
            // Only count if this interaction is with one of our friends
            if (friendIds.includes(friendId)) {
                giftCounts.set(friendId, (giftCounts.get(friendId) || 0) + 1);
            }
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

            const charStats = statsMap.get(otherId);

            const friendData = {
                id: f.id, // Friendship ID
                friendId: otherId,
                username: otherUser.username || otherUser.firstName || otherUser.emailAddresses[0]?.emailAddress?.split('@')[0] || 'Unknown',
                imageUrl: otherUser.imageUrl,
                status: f.status,
                isSender, // To know if I sent the request or received it
                createdAt: f.created_at,
                title: charStats?.title,
                lastSeen: charStats?.last_seen,
                stats: {
                    level: charStats?.level || 1,
                    xp: charStats?.xp || 0,
                    questsFinished: questCounts.get(otherId) || 0,
                    giftsShared: giftCounts.get(otherId) || 0,
                    challengesFinished: challengeCounts.get(otherId) || 0,
                    streak: streakMap.get(otherId) || 0,
                    allianceName: allianceNameMap.get(allianceIdMap.get(otherId) || '') || null
                }
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
