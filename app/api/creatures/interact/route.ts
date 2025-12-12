
import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server-client';
import { CREATURE_DEFINITIONS } from '@/lib/creature-mapping';
import { grantReward } from '@/app/api/kingdom/grantReward';

const supabase = supabaseServer;

export async function POST(request: NextRequest) {
    try {
        const { userId } = await getAuth(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { instanceId, definitionId } = body;

        if (!definitionId) {
            return NextResponse.json({ error: 'Missing definitionId' }, { status: 400 });
        }

        const def = CREATURE_DEFINITIONS[definitionId];
        if (!def) {
            return NextResponse.json({ error: 'Invalid creature definition' }, { status: 400 });
        }

        // Logic Check: Is it a sheep? (ID '001' is sheep in our mapping usually, let's verify or assume)
        // Adjust this check based on your actual IDs. 
        // Assuming '001' is Sheep based on previous context.
        const isSheep = def.name.toLowerCase().includes('sheep');

        if (!isSheep) {
            // For now, only sheep give rewards. Others just interact.
            return NextResponse.json({
                message: `You greeted the ${def.name}. It looked at you weirdly.`,
                interacted: true
            });
        }

        // Check last interaction time for this user and this creature type
        // Note: We track by TYPE (definitionId) for now, not specific instance 
        // because instances are re-generated on client on reload.
        const fiveDaysAgo = new Date();
        fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

        const { data: recentInteractions, error: fetchError } = await supabase
            .from('creature_interactions')
            .select('*')
            .eq('user_id', userId)
            .eq('creature_definition_id', definitionId)
            .eq('interaction_type', 'shave')
            .gt('occurred_at', fiveDaysAgo.toISOString())
            .order('occurred_at', { ascending: false })
            .limit(1);

        if (fetchError) {
            console.error('Error checking interactions:', fetchError);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        if (recentInteractions && recentInteractions.length > 0) {
            const lastTime = new Date(recentInteractions[0].occurred_at);
            const daysLeft = 5 - Math.floor((Date.now() - lastTime.getTime()) / (1000 * 60 * 60 * 24));

            return NextResponse.json({
                message: `This sheep has already been shaved! Wool grows back in ${daysLeft} days.`,
                cooldown: true
            });
        }

        // Apply Reward
        const rewardAmount = 20;
        const success = await grantReward({
            userId,
            type: 'gold',
            amount: rewardAmount,
            relatedId: 'sheep-shave',
            context: { source: 'creature_interaction', creature: def.name }
        });

        if (!success) {
            return NextResponse.json({ error: 'Failed to grant reward' }, { status: 500 });
        }

        // Log Interaction
        await supabase
            .from('creature_interactions')
            .insert({
                user_id: userId,
                creature_definition_id: definitionId,
                creature_instance_id: instanceId, // Optional, logged for debug
                interaction_type: 'shave'
            });

        return NextResponse.json({
            message: `You shaved the sheep! +${rewardAmount} Gold`,
            reward: { type: 'gold', amount: rewardAmount },
            shaved: true
        });

    } catch (error) {
        console.error('Creature interaction error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
