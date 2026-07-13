import { logger } from "@/lib/logger";
import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server-client';
import { calculateRewards } from '@/lib/game-logic';

export async function POST(request: Request) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { friendId, name, description, difficulty, category, baseGoal, milestoneGoal } = await request.json();

        if (!friendId || !name || !difficulty || !category || !baseGoal || !milestoneGoal) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Verify friendship
        const { data: friendship } = await supabaseServer
            .from('friends')
            .select('*')
            .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`)
            .eq('status', 'accepted')
            .maybeSingle();

        if (!friendship) {
            return NextResponse.json({ error: 'Not friends with this user' }, { status: 403 });
        }

        // 2. Calculate rewards
        const rewards = calculateRewards(difficulty);

        // 3. Create the challenge
        const { data: challenge, error: challengeError } = await supabaseServer
            .from('challenges')
            .insert({
                user_id: friendId, // Recipient owns it
                name,
                description: description || '',
                category,
                difficulty,
                xp: rewards.xp,
                gold: rewards.gold,
                base_goal: baseGoal,
                milestone_goal: milestoneGoal,
                is_friend_challenge: true,
                sender_id: userId,
                recipient_id: friendId,
                status: 'pending' // Pending acceptance
            })
            .select()
            .single();

        if (challengeError) {
            logger.error('Error creating friend challenge:', challengeError);
            return NextResponse.json({ error: 'Failed to send challenge' }, { status: 500 });
        }

        // 4. Create notification
        const clerk = await clerkClient();
        const sender = await clerk.users.getUser(userId);
        const senderName = sender.username || sender.firstName || 'Someone';

        await supabaseServer
            .from('notifications')
            .insert({
                user_id: friendId,
                type: 'friend_challenge_received',
                data: {
                    senderId: userId,
                    senderName: senderName,
                    challengeId: challenge.id,
                    challengeName: name,
                    baseGoal,
                    milestoneGoal
                }
            });

        return NextResponse.json({ success: true, challenge });

    } catch (error) {
        logger.error('Error in /api/challenges/friend:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
