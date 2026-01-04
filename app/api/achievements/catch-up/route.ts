import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server-client';
import { AchievementManager, ACHIEVEMENTS, AchievementType } from '@/lib/achievement-manager';

/**
 * POST /api/achievements/catch-up
 * 
 * This endpoint checks the current state of the user's progress and
 * retroactively unlocks any achievements they should have already earned.
 * This is useful when:
 * - A user had friends before the achievement system was implemented
 * - A user has placed/destroyed tiles before the achievement fix was applied
 * - New achievements are added to the system
 */
export async function POST(request: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log(`[ACHIEVEMENTS][CATCH-UP] Starting catch-up check for user: ${userId}`);

        const achievementManager = new AchievementManager(supabaseServer);
        const unlockedAchievements: string[] = [];

        // ============================================
        // 1. Check FRIEND achievements (first_friend, five_friends, ten_friends)
        // ============================================
        const { count: friendCount } = await supabaseServer
            .from('friends')
            .select('*', { count: 'exact', head: true })
            .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
            .eq('status', 'accepted');

        console.log(`[ACHIEVEMENTS][CATCH-UP] User has ${friendCount || 0} accepted friends`);

        if (friendCount && friendCount >= 1) {
            const unlocked = await achievementManager.checkAndUnlock(userId, 'first_friend', friendCount);
            if (unlocked) unlockedAchievements.push('first_friend');
        }
        if (friendCount && friendCount >= 5) {
            const unlocked = await achievementManager.checkAndUnlock(userId, 'five_friends', friendCount);
            if (unlocked) unlockedAchievements.push('five_friends');
        }
        if (friendCount && friendCount >= 10) {
            const unlocked = await achievementManager.checkAndUnlock(userId, 'ten_friends', friendCount);
            if (unlocked) unlockedAchievements.push('ten_friends');
        }

        // ============================================
        // 2. Check QUEST SENDING achievements (first_quest_sent, five_quests_sent, ten_quests_sent)
        // ============================================
        const { count: sentQuestCount } = await supabaseServer
            .from('quests')
            .select('*', { count: 'exact', head: true })
            .eq('sender_id', userId)
            .eq('is_friend_quest', true);

        console.log(`[ACHIEVEMENTS][CATCH-UP] User has sent ${sentQuestCount || 0} friend quests`);

        if (sentQuestCount && sentQuestCount >= 1) {
            const unlocked = await achievementManager.checkAndUnlock(userId, 'first_quest_sent', sentQuestCount);
            if (unlocked) unlockedAchievements.push('first_quest_sent');
        }
        if (sentQuestCount && sentQuestCount >= 5) {
            const unlocked = await achievementManager.checkAndUnlock(userId, 'five_quests_sent', sentQuestCount);
            if (unlocked) unlockedAchievements.push('five_quests_sent');
        }
        if (sentQuestCount && sentQuestCount >= 10) {
            const unlocked = await achievementManager.checkAndUnlock(userId, 'ten_quests_sent', sentQuestCount);
            if (unlocked) unlockedAchievements.push('ten_quests_sent');
        }

        // ============================================
        // 3. Check TILE achievements based on realm_tiles table
        // ============================================
        // Count tiles by type placed by the user
        const { data: tileCounts } = await supabaseServer
            .from('realm_tiles')
            .select('tile_type')
            .eq('user_id', userId);

        if (tileCounts) {
            // Count tiles by type
            const tileTypeCounts: Record<number, number> = {};
            tileCounts.forEach(tile => {
                tileTypeCounts[tile.tile_type] = (tileTypeCounts[tile.tile_type] || 0) + 1;
            });

            console.log(`[ACHIEVEMENTS][CATCH-UP] Tile type counts:`, tileTypeCounts);

            // Tile type mappings (from tileTypeToNumeric in realm code):
            // 1 = grass, 2 = forest, 3 = mountain, 4 = water, 5 = lava, 
            // 6 = snow, 7 = desert, 8 = swamp, 9 = road, 10 = bridge,
            // 11 = castle, 12 = town, etc.

            // For creature achievements, we need to insert into the main achievements table
            const waterCount = tileTypeCounts[4] || 0;
            const forestCount = (tileTypeCounts[2] || 0) + (tileTypeCounts[1] || 0); // forest + grass
            const iceCount = tileTypeCounts[6] || 0; // snow/ice

            // Helper to unlock realm creature achievement
            const unlockCreatureAchievement = async (achievementId: string, name: string, description: string) => {
                // Check if already in achievements table
                const { data: existing } = await supabaseServer
                    .from('achievements')
                    .select('id')
                    .eq('user_id', userId)
                    .eq('achievement_id', achievementId)
                    .single();

                if (!existing) {
                    await supabaseServer.from('achievements').insert({
                        user_id: userId,
                        achievement_id: achievementId,
                        achievement_name: name,
                        description: description,
                        unlocked_at: new Date().toISOString(),
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    });
                    console.log(`[ACHIEVEMENTS][CATCH-UP] ✅ Unlocked creature: ${name}`);
                    unlockedAchievements.push(achievementId);
                }
            };

            // Water creatures
            if (waterCount >= 1) await unlockCreatureAchievement('004', 'Dolphio', 'A playful water creature that appears when expanding water territories.');
            if (waterCount >= 5) await unlockCreatureAchievement('005', 'Divero', 'A more experienced water dweller, guardian of expanding waters.');
            if (waterCount >= 10) await unlockCreatureAchievement('006', 'Flippur', 'The supreme water creature, master of vast water territories.');

            // Forest/Grass creatures  
            if (forestCount >= 1) await unlockCreatureAchievement('007', 'Leaf', 'A small grass creature that appears when planting new forests.');
            if (forestCount >= 5) await unlockCreatureAchievement('008', 'Oaky', 'A stronger forest guardian, protector of growing woodlands.');
            if (forestCount >= 10) await unlockCreatureAchievement('009', 'Seqoio', 'The mighty forest spirit, overseer of vast woodlands.');

            // Ice creatures
            if (iceCount >= 1) await unlockCreatureAchievement('013', 'IceCube', 'A small ice creature born from placing ice tiles.');
            if (iceCount >= 5) await unlockCreatureAchievement('014', 'Iciclo', 'A sharp ice spirit responding to expanded frozen lands.');
            if (iceCount >= 10) await unlockCreatureAchievement('015', 'Glacior', 'The ruler of the frozen wastes, master of ice placement.');
        }

        console.log(`[ACHIEVEMENTS][CATCH-UP] Completed. Newly unlocked: ${unlockedAchievements.length}`);

        return NextResponse.json({
            success: true,
            checked: {
                friends: friendCount || 0,
                questsSent: sentQuestCount || 0
            },
            newlyUnlocked: unlockedAchievements,
            message: unlockedAchievements.length > 0
                ? `Congratulations! ${unlockedAchievements.length} achievements unlocked!`
                : 'All achievements are up to date.'
        });

    } catch (error) {
        console.error('[ACHIEVEMENTS][CATCH-UP] Error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
