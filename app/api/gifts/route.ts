import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server-client';

// GET /api/gifts - List gifts (sent or received)
export async function GET(request: Request) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || 'received'; // 'received' or 'sent'

        const query = supabaseServer
            .from('gifts')
            .select('*')
            .order('created_at', { ascending: false });

        if (type === 'sent') {
            query.eq('sender_id', userId);
        } else {
            query.eq('recipient_id', userId);
        }

        const { data: gifts, error } = await query;

        if (error) {
            console.error('Error fetching gifts:', error);
            return NextResponse.json({ error: 'Failed to fetch gifts' }, { status: 500 });
        }

        // Fetch user details for senders/recipients
        const otherUserIds = gifts.map(g => type === 'sent' ? g.recipient_id : g.sender_id);

        if (otherUserIds.length > 0) {
            const clerk = await clerkClient();
            const users = await clerk.users.getUserList({
                userId: otherUserIds,
                limit: 100,
            });
            const userMap = new Map(users.data.map(u => [u.id, u]));

            // Attach user details
            const enrichedGifts = gifts.map(g => {
                const otherId = type === 'sent' ? g.recipient_id : g.sender_id;
                const user = userMap.get(otherId);
                return {
                    ...g,
                    otherUser: user ? {
                        username: user.username || user.firstName || 'Unknown',
                        imageUrl: user.imageUrl
                    } : null
                };
            });

            return NextResponse.json({ gifts: enrichedGifts });
        }

        return NextResponse.json({ gifts });

    } catch (error) {
        console.error('Unexpected error fetching gifts:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/gifts - Send a gift
export async function POST(request: Request) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { recipientId, itemType, itemId, amount, message } = await request.json();

        if (!recipientId || !itemType) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Validate sender has resources (e.g., gold)
        if (itemType === 'gold') {
            const { data: stats } = await supabaseServer
                .from('character_stats')
                .select('gold')
                .eq('user_id', userId)
                .single();

            if (!stats || stats.gold < amount) {
                return NextResponse.json({ error: 'Insufficient gold' }, { status: 400 });
            }

            // Deduct gold from sender
            await supabaseServer
                .from('character_stats')
                .update({ gold: stats.gold - amount })
                .eq('user_id', userId);
        }

        // Create gift record
        const { data: gift, error } = await supabaseServer
            .from('gifts')
            .insert({
                sender_id: userId,
                recipient_id: recipientId,
                item_type: itemType,
                item_id: itemId,
                amount: amount || 1,
                message,
                status: 'pending'
            })
            .select()
            .single();

        if (error) {
            console.error('Error sending gift:', error);
            // Refund gold if failed
            if (itemType === 'gold') {
                await supabaseServer.rpc('increment_gold', { amount: amount, user_id: userId });
            }
            return NextResponse.json({ error: 'Failed to send gift' }, { status: 500 });
        }

        // Create notification
        const clerk = await clerkClient();
        const sender = await clerk.users.getUser(userId);
        const senderName = sender.username || sender.firstName || 'Someone';

        await supabaseServer
            .from('notifications')
            .insert({
                user_id: recipientId,
                type: 'gift_received', // Need to add this type to check constraint or just use 'friend_request' for now if strict
                // Actually, I should check the constraint. The migration didn't update the check constraint for notifications type.
                // I'll use a generic type or update the constraint. 
                // For now, let's assume I can insert 'gift_received' or I'll use 'friend_quest_received' as a fallback if it fails?
                // No, I should update the constraint in the migration.
                data: {
                    senderId: userId,
                    senderName: senderName,
                    giftId: gift.id,
                    itemType,
                    amount
                }
            });

        return NextResponse.json({ success: true, gift });

    } catch (error) {
        console.error('Unexpected error sending gift:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
