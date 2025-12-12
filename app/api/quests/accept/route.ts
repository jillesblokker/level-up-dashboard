
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

        if (action === 'accept') {
            const questData = notification.data;

            // Verify we have necessary quest data
            if (!questData.questId) {
                return NextResponse.json({ error: 'Invalid quest data' }, { status: 400 });
            }

            // 2. Fetch original quest details (to ensure we have latest data and it exists)
            const { data: sourceQuest, error: questError } = await supabaseServer
                .from('quests')
                .select('*')
                .eq('id', questData.questId)
                .single();

            if (questError || !sourceQuest) {
                // Fallback: If original quest is gone, maybe use data in notification if available?
                // For now, let's error out or check if we have enough backup data
                return NextResponse.json({ error: 'Original quest no longer exists' }, { status: 404 });
            }

            // 3. Create new quest for the current user
            const { error: createError } = await supabaseServer
                .from('quests')
                .insert({
                    name: sourceQuest.name,
                    description: sourceQuest.description,
                    category: sourceQuest.category,
                    difficulty: sourceQuest.difficulty,
                    xp_reward: sourceQuest.xp_reward,
                    gold_reward: sourceQuest.gold_reward,
                    user_id: userId, // Assign to current user
                });

            if (createError) {
                throw createError;
            }
        }

        // 4. Mark notification as read (and maybe update status to 'accepted'/'rejected' in data?)
        // For now, just mark read so it disappears from "New" list, or we can delete it?
        // The UI filters by !read usually for "active" alerts, but shows history. Behaving like standard notification.

        await supabaseServer
            .from('notifications')
            .update({
                is_read: true,
                data: { ...notification.data, status: action } // Store status
            })
            .eq('id', notificationId);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error processing quest acceptance:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
