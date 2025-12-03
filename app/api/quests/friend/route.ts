import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server-client';

export async function POST(request: Request) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { friendId, title, description, difficulty, category, rewards } = await request.json();

        if (!friendId || !title || !description || !difficulty || !category) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Verify friendship
        const { data: friendship } = await supabaseServer
            .from('friends')
            .select('*')
            .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`)
            .eq('status', 'accepted')
            .single();

        if (!friendship) {
            return NextResponse.json({ error: 'Not friends with this user' }, { status: 403 });
        }

        // 2. Create the quest
        // Note: 'quests' table doesn't have a user_id column for ownership in the schema I recall, 
        // but my recent migration added user_id to it. 
        // Wait, the migration added user_id to quests table? Yes, "add-user-id-to-content-tables.sql".
        // So I should set user_id to the RECIPIENT, so they see it.
        // And set sender_id to ME.

        const { data: quest, error: questError } = await supabaseServer
            .from('quests')
            .insert({
                user_id: friendId, // The recipient owns the quest
                title,
                description,
                difficulty,
                category,
                xp_reward: rewards?.xp || 50, // Default rewards if not specified
                gold_reward: rewards?.gold || 10,
                is_friend_quest: true,
                sender_id: userId,
                recipient_id: friendId,
                is_custom: true // Mark as custom so it's distinguishable
            })
            .select()
            .single();

        if (questError) {
            console.error('Error creating friend quest:', questError);
            return NextResponse.json({ error: 'Failed to send quest' }, { status: 500 });
        }

        // 3. Create notification
        const clerk = await clerkClient();
        const sender = await clerk.users.getUser(userId);
        const senderName = sender.username || sender.firstName || 'Someone';

        await supabaseServer
            .from('notifications')
            .insert({
                user_id: friendId,
                type: 'friend_quest_received',
                data: {
                    senderId: userId,
                    senderName: senderName,
                    questId: quest.id,
                    questTitle: title
                }
            });

        return NextResponse.json({ success: true, quest });

    } catch (error) {
        console.error('Unexpected error sending friend quest:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
