import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server-client';
import { ACHIEVEMENTS, AchievementType } from '@/lib/achievement-manager';

/**
 * POST /api/achievements/catch-up
 * 
 * This endpoint checks the current state of the user's progress and
 * retroactively unlocks any achievements they should have already earned.
 */
export async function POST(request: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log(`[ACHIEVEMENTS][CATCH-UP] Starting catch-up check for user: ${userId}`);

        const unlockedAchievements: string[] = [];
        const errors: string[] = [];

        // Helper function to directly unlock an achievement
        const unlockAchievement = async (
            achievementId: string,
            achievementType: AchievementType | null,
            name: string,
            description: string,
            xpReward: number = 0,
            goldReward: number = 0
        ) => {
            try {
                // Check if already in main achievements table
                const { data: existingMain } = await supabaseServer
                    .from('achievements')
                    .select('id')
                    .eq('user_id', userId)
                    .eq('achievement_id', achievementId)
                    .maybeSingle();

                if (!existingMain) {
                    // Insert into main achievements table
                    const { error: insertError } = await supabaseServer.from('achievements').insert({
                        user_id: userId,
                        achievement_id: achievementId,
                        achievement_name: name,
                        description: description,
                        unlocked_at: new Date().toISOString(),
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    });

                    if (insertError) {
                        console.error(`[ACHIEVEMENTS][CATCH-UP] Error inserting ${name}:`, insertError);
                        errors.push(`Failed to insert ${name}: ${insertError.message}`);
                        return false;
                    }

                    console.log(`[ACHIEVEMENTS][CATCH-UP] ✅ Unlocked: ${name} (${achievementId})`);
                    unlockedAchievements.push(name);

                    // Also insert into alliance_achievements if it's a social achievement
                    if (achievementType) {
                        const { data: existingAlliance } = await supabaseServer
                            .from('alliance_achievements')
                            .select('id')
                            .eq('user_id', userId)
                            .eq('achievement_type', achievementType)
                            .maybeSingle();

                        if (!existingAlliance) {
                            await supabaseServer.from('alliance_achievements').insert({
                                user_id: userId,
                                achievement_type: achievementType,
                                progress: 999, // Already completed
                                unlocked_at: new Date().toISOString()
                            });
                        }
                    }

                    // Award XP and Gold if rewards are specified
                    if (xpReward > 0 || goldReward > 0) {
                        try {
                            const { data: stats } = await supabaseServer
                                .from('character_stats')
                                .select('gold, experience')
                                .eq('user_id', userId)
                                .single();

                            if (stats) {
                                await supabaseServer
                                    .from('character_stats')
                                    .update({
                                        gold: (stats.gold || 0) + goldReward,
                                        experience: (stats.experience || 0) + xpReward,
                                        updated_at: new Date().toISOString()
                                    })
                                    .eq('user_id', userId);
                                console.log(`[ACHIEVEMENTS][CATCH-UP] ✅ Awarded ${goldReward} gold, ${xpReward} XP`);
                            }
                        } catch (rewardErr) {
                            console.error('[ACHIEVEMENTS][CATCH-UP] Error awarding rewards:', rewardErr);
                        }
                    }

                    return true;
                } else {
                    console.log(`[ACHIEVEMENTS][CATCH-UP] Already unlocked: ${name}`);
                    return false;
                }
            } catch (err) {
                console.error(`[ACHIEVEMENTS][CATCH-UP] Error unlocking ${name}:`, err);
                errors.push(`Exception unlocking ${name}`);
                return false;
            }
        };

        // ============================================
        // 1. Check FRIEND achievements
        // ============================================
        console.log('[ACHIEVEMENTS][CATCH-UP] Checking friend count...');

        const { count: friendCount, error: friendError } = await supabaseServer
            .from('friends')
            .select('*', { count: 'exact', head: true })
            .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
            .eq('status', 'accepted');

        if (friendError) {
            console.error('[ACHIEVEMENTS][CATCH-UP] Error counting friends:', friendError);
            errors.push(`Friend count error: ${friendError.message}`);
        } else {
            console.log(`[ACHIEVEMENTS][CATCH-UP] User has ${friendCount || 0} accepted friends`);

            if (friendCount && friendCount >= 1) {
                await unlockAchievement('107', 'first_friend', 'First Alliance', 'Add your first ally to your fellowship', 50, 10);
            }
            if (friendCount && friendCount >= 5) {
                await unlockAchievement('108', 'five_friends', 'Guild Founder', 'Gather 5 allies to your cause', 100, 50);
            }
            if (friendCount && friendCount >= 10) {
                await unlockAchievement('109', 'ten_friends', 'Fellowship Leader', 'Unite 10 allies under your banner', 200, 100);
            }
        }

        // ============================================
        // 2. Check QUEST SENDING achievements
        // ============================================
        console.log('[ACHIEVEMENTS][CATCH-UP] Checking quests sent...');

        const { count: sentQuestCount, error: questError } = await supabaseServer
            .from('quests')
            .select('*', { count: 'exact', head: true })
            .eq('sender_id', userId)
            .eq('is_friend_quest', true);

        if (questError) {
            console.error('[ACHIEVEMENTS][CATCH-UP] Error counting quests:', questError);
            errors.push(`Quest count error: ${questError.message}`);
        } else {
            console.log(`[ACHIEVEMENTS][CATCH-UP] User has sent ${sentQuestCount || 0} friend quests`);

            if (sentQuestCount && sentQuestCount >= 1) {
                await unlockAchievement('110', 'first_quest_sent', 'Quest Giver', 'Send your first quest to a friend', 50, 10);
            }
            if (sentQuestCount && sentQuestCount >= 5) {
                await unlockAchievement('111', 'five_quests_sent', 'Master Strategist', 'Send 5 quests to challenge your allies', 150, 75);
            }
            if (sentQuestCount && sentQuestCount >= 10) {
                await unlockAchievement('112', 'ten_quests_sent', 'Grand Questmaster', 'Send 10 quests to friends and earn the title of Questmaster', 500, 100);
            }
        }

        // ============================================
        // 3. Check TILE achievements based on realm_tiles table
        // ============================================
        console.log('[ACHIEVEMENTS][CATCH-UP] Checking tile counts...');

        const { data: tileCounts, error: tileError } = await supabaseServer
            .from('realm_tiles')
            .select('tile_type')
            .eq('user_id', userId);

        if (tileError) {
            console.error('[ACHIEVEMENTS][CATCH-UP] Error counting tiles:', tileError);
            errors.push(`Tile count error: ${tileError.message}`);
        } else if (tileCounts) {
            // Count tiles by type
            const tileTypeCounts: Record<number, number> = {};
            tileCounts.forEach(tile => {
                tileTypeCounts[tile.tile_type] = (tileTypeCounts[tile.tile_type] || 0) + 1;
            });

            console.log(`[ACHIEVEMENTS][CATCH-UP] Tile type counts:`, tileTypeCounts);

            // Tile type mappings:
            // 1 = grass, 2 = forest, 3 = mountain, 4 = water, 5 = lava, 6 = snow/ice
            const waterCount = tileTypeCounts[4] || 0;
            const forestCount = (tileTypeCounts[2] || 0) + (tileTypeCounts[1] || 0); // forest + grass
            const iceCount = tileTypeCounts[6] || 0; // snow/ice

            // Water creatures
            if (waterCount >= 1) await unlockAchievement('004', null, 'Dolphio', 'A playful water creature that appears when expanding water territories.', 100, 50);
            if (waterCount >= 5) await unlockAchievement('005', null, 'Divero', 'A more experienced water dweller, guardian of expanding waters.', 200, 100);
            if (waterCount >= 10) await unlockAchievement('006', null, 'Flippur', 'The supreme water creature, master of vast water territories.', 500, 250);

            // Forest/Grass creatures  
            if (forestCount >= 1) await unlockAchievement('007', null, 'Leaf', 'A small grass creature that appears when planting new forests.', 100, 50);
            if (forestCount >= 5) await unlockAchievement('008', null, 'Oaky', 'A stronger forest guardian, protector of growing woodlands.', 200, 100);
            if (forestCount >= 10) await unlockAchievement('009', null, 'Seqoio', 'The mighty forest spirit, overseer of vast woodlands.', 500, 250);

            // Ice creatures
            if (iceCount >= 1) await unlockAchievement('013', null, 'IceCube', 'A small ice creature born from placing ice tiles.', 100, 50);
            if (iceCount >= 5) await unlockAchievement('014', null, 'Iciclo', 'A sharp ice spirit responding to expanded frozen lands.', 200, 100);
            if (iceCount >= 10) await unlockAchievement('015', null, 'Glacior', 'The ruler of the frozen wastes, master of ice placement.', 500, 250);

            // Mountain destroyer (special achievement)
            const mountainCount = tileTypeCounts[3] || 0;
            // Note: We can't easily track destroyed tiles from realm_tiles, but we can check if user has the Mountain Destroyer achievement requirement met
        }

        // ============================================
        // 4. Check for Mountain Destroyer achievement (ID 201)
        // This one is triggered when destroying a mountain, but we can retroactively check
        // if the user has ever destroyed a mountain by checking localStorage sync or other means
        // For now, we'll skip this as it requires a different approach
        // ============================================

        console.log(`[ACHIEVEMENTS][CATCH-UP] Completed. Newly unlocked: ${unlockedAchievements.length}`);

        return NextResponse.json({
            success: true,
            checked: {
                friends: friendCount || 0,
                questsSent: sentQuestCount || 0,
                tiles: tileCounts?.length || 0
            },
            newlyUnlocked: unlockedAchievements,
            errors: errors.length > 0 ? errors : undefined,
            message: unlockedAchievements.length > 0
                ? `🏆 ${unlockedAchievements.length} achievement(s) unlocked: ${unlockedAchievements.join(', ')}`
                : 'All achievements are up to date.'
        });

    } catch (error) {
        console.error('[ACHIEVEMENTS][CATCH-UP] Error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        }, { status: 500 });
    }
}

// Also support GET for easy testing
export async function GET(request: Request) {
    return POST(request);
}
