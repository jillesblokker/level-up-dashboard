import { logger } from "@/lib/logger";
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server-client';

export async function POST(request: Request) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { notificationId, action } = await request.json();

        if (!notificationId || !action) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Fetch the notification to verify ownership and get data
        const { data: notification, error: notifError } = await supabaseServer
            .from('notifications')
            .select('*')
            .eq('id', notificationId)
            .eq('user_id', userId)
            .single();

        if (notifError || !notification) {
            return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
        }

        const { challengeId } = notification.data || {};

        if (!challengeId) {
            return NextResponse.json({ error: 'Invalid challenge data in notification' }, { status: 400 });
        }

        if (action === 'accept') {
            // Update challenge status to accepted
            const { error: updateError } = await supabaseServer
                .from('challenges')
                .update({ status: 'accepted' })
                .eq('id', challengeId)
                .eq('user_id', userId);

            if (updateError) {
                logger.error('Error accepting challenge:', updateError);
                return NextResponse.json({ error: 'Failed to accept challenge' }, { status: 500 });
            }
        } else if (action === 'reject') {
            // Delete the pending challenge
            const { error: deleteError } = await supabaseServer
                .from('challenges')
                .delete()
                .eq('id', challengeId)
                .eq('user_id', userId);

            if (deleteError) {
                logger.error('Error rejecting challenge:', deleteError);
                return NextResponse.json({ error: 'Failed to reject challenge' }, { status: 500 });
            }
        }

        // 2. Mark notification as read
        await supabaseServer
            .from('notifications')
            .update({
                is_read: true,
                data: { ...notification.data, status: action }
            })
            .eq('id', notificationId);

        return NextResponse.json({ success: true });

    } catch (error) {
        logger.error('Error processing challenge response:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
