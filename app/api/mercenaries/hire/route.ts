import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server-client';
import { apiLogger } from '@/lib/logger';

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { friendId } = await req.json();
        if (!friendId) {
            return NextResponse.json({ error: 'Missing friendId' }, { status: 400 });
        }

        // 1. Fetch friend's stats
        const { data: friendStats, error: statsError } = await supabaseServer
            .from('character_stats')
            .select('strength, intelligence, vitality, username')
            .eq('user_id', friendId)
            .single();

        if (statsError || !friendStats) {
            apiLogger.error(`Error fetching friend stats: ${statsError?.message}`);
            return NextResponse.json({ error: 'Friend not found or stats missing' }, { status: 404 });
        }

        // 2. Determine top stat for buff
        const stats = [
            { name: 'Might', value: friendStats.strength || 0, type: 'strength' },
            { name: 'Intelligence', value: friendStats.intelligence || 0, type: 'intelligence' },
            { name: 'Vitality', value: friendStats.vitality || 0, type: 'vitality' }
        ];
        
        const topStat = stats.reduce((prev, current) => (prev.value > current.value) ? prev : current);

        // 3. Create buff record
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        const { error: buffError } = await supabaseServer
            .from('active_modifiers')
            .upsert({
                user_id: userId,
                name: 'Mercenary Buff',
                value: topStat.type,
                description: `Hired ${friendStats.username}. Buff: +20% ${topStat.name}`,
                expires_at: expiresAt.toISOString(),
                metadata: {
                    friend_id: friendId,
                    friend_name: friendStats.username,
                    stat_type: topStat.type
                }
            }, { onConflict: 'user_id, name' });

        if (buffError) {
            apiLogger.error(`Error creating mercenary buff: ${buffError.message}`);
            return NextResponse.json({ error: 'Failed to create buff' }, { status: 500 });
        }

        apiLogger.info(`User ${userId} hired mercenary ${friendStats.username} for ${topStat.name} buff`);

        return NextResponse.json({
            success: true,
            buff: {
                name: friendStats.username,
                stat: topStat.name,
                type: topStat.type,
                expiresAt: expiresAt.toISOString()
            }
        });

    } catch (error: any) {
        apiLogger.error(`Hire Mercenary Error: ${error.message}`);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
