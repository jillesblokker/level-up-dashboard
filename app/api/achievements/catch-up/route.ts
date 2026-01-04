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
        }

        // ============================================
        // 4. Check MONSTER BATTLE achievements (201-206)
        // Based on defeated monsters in monster_spawns table
        // ============================================
        console.log('[ACHIEVEMENTS][CATCH-UP] Checking defeated monsters...');

        const { data: defeatedMonsters, error: monsterError } = await supabaseServer
            .from('monster_spawns')
            .select('monster_type')
            .eq('user_id', userId)
            .eq('defeated', true);

        if (monsterError) {
            console.error('[ACHIEVEMENTS][CATCH-UP] Error fetching monsters:', monsterError);
            errors.push(`Monster fetch error: ${monsterError.message}`);
        } else if (defeatedMonsters && defeatedMonsters.length > 0) {
            // Get unique monster types defeated
            const defeatedTypes = new Set(defeatedMonsters.map(m => m.monster_type?.toLowerCase()));
            console.log(`[ACHIEVEMENTS][CATCH-UP] Defeated monster types:`, Array.from(defeatedTypes));

            // Monster type to achievement mapping
            const monsterAchievements: Record<string, { id: string; name: string; desc: string }> = {
                'dragon': { id: '201', name: 'Ancient Dragon Slayer', desc: 'Face the ancient winged beast. Watch its movements closely and strike true.' },
                'dragoni': { id: '201', name: 'Ancient Dragon Slayer', desc: 'Face the ancient winged beast.' },
                'goblin': { id: '202', name: 'Goblin Hunter', desc: 'The crafty looting menace hides in the shadows. Match its cunning moves.' },
                'orci': { id: '202', name: 'Goblin Hunter', desc: 'The crafty looting menace.' },
                'troll': { id: '203', name: 'Troll Crusher', desc: 'A mountain of muscle blocks your path. Mimic its brute force to bring it down.' },
                'trollie': { id: '203', name: 'Troll Crusher', desc: 'A mountain of muscle blocks your path.' },
                'wizard': { id: '204', name: 'Dark Wizard Vanquisher', desc: 'Magic swirls in complex patterns. Memorize the arcane sequence.' },
                'sorcero': { id: '204', name: 'Dark Wizard Vanquisher', desc: 'Magic swirls in complex patterns.' },
                'pegasus': { id: '205', name: 'Pegasus Tamer', desc: 'A majestic creature of the clouds. Follow its graceful flight to earn its trust.' },
                'peggie': { id: '205', name: 'Pegasus Tamer', desc: 'A majestic creature of the clouds.' },
                'fairy': { id: '206', name: 'Fairy Friend', desc: 'Small and swift, dancing in the light. Keep up with the fae\'s rhythm.' },
                'fairiel': { id: '206', name: 'Fairy Friend', desc: 'Small and swift, dancing in the light.' }
            };

            for (const monsterType of defeatedTypes) {
                if (monsterType && monsterAchievements[monsterType]) {
                    const ach = monsterAchievements[monsterType];
                    await unlockAchievement(ach.id, null, ach.name, ach.desc, 100, 100);
                }
            }
        }

        // ============================================
        // 5. Check QUEST COMPLETION achievements
        // Based on completed quests count
        // ============================================
        console.log('[ACHIEVEMENTS][CATCH-UP] Checking completed quests...');

        const { count: completedQuestCount, error: questCompleteError } = await supabaseServer
            .from('quests')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('completed', true);

        if (questCompleteError) {
            console.error('[ACHIEVEMENTS][CATCH-UP] Error counting completed quests:', questCompleteError);
            errors.push(`Quest completion count error: ${questCompleteError.message}`);
        } else {
            console.log(`[ACHIEVEMENTS][CATCH-UP] User has completed ${completedQuestCount || 0} quests`);

            // Quest Completion Achievements (301-303)
            if (completedQuestCount && completedQuestCount >= 10) {
                await unlockAchievement('301', null, 'Quest Apprentice', 'Every journey begins with a single step. Complete your first 10 quests.', 100, 50);
            }
            if (completedQuestCount && completedQuestCount >= 25) {
                await unlockAchievement('302', null, 'Quest Journeyman', 'Your dedication to duty grows stronger. Complete 25 quests.', 250, 125);
            }
            if (completedQuestCount && completedQuestCount >= 50) {
                await unlockAchievement('303', null, 'Quest Master', 'Legendary heroes are forged through countless trials. Complete 50 quests.', 500, 250);
            }
        }

        // ============================================
        // 6. Check CHARACTER LEVEL achievements (304-306)
        // ============================================
        console.log('[ACHIEVEMENTS][CATCH-UP] Checking character level...');

        const { data: characterStats, error: statsError } = await supabaseServer
            .from('character_stats')
            .select('level, gold, experience')
            .eq('user_id', userId)
            .single();

        if (statsError) {
            console.error('[ACHIEVEMENTS][CATCH-UP] Error fetching character stats:', statsError);
            errors.push(`Character stats error: ${statsError.message}`);
        } else if (characterStats) {
            const level = characterStats.level || 1;
            const gold = characterStats.gold || 0;
            console.log(`[ACHIEVEMENTS][CATCH-UP] User is level ${level} with ${gold} gold`);

            // Level Achievements (304-306)
            if (level >= 5) {
                await unlockAchievement('304', null, 'Rising Hero', 'Your power grows. Reach level 5.', 150, 75);
            }
            if (level >= 10) {
                await unlockAchievement('305', null, 'Seasoned Adventurer', 'Experience has made you wise. Reach level 10.', 300, 150);
            }
            if (level >= 25) {
                await unlockAchievement('306', null, 'Legendary Champion', 'Few reach such heights. Reach level 25.', 750, 400);
            }

            // Gold Achievements (310-312) - based on current gold (could also track total earned)
            if (gold >= 1000) {
                await unlockAchievement('310', null, 'Coin Collector', 'A growing treasury. Accumulate 1,000 gold total.', 100, 100);
            }
            if (gold >= 5000) {
                await unlockAchievement('311', null, 'Wealthy Merchant', 'Your coffers overflow. Accumulate 5,000 gold total.', 250, 250);
            }
            if (gold >= 10000) {
                await unlockAchievement('312', null, 'Golden Sovereign', 'A fortune fit for royalty. Accumulate 10,000 gold total.', 500, 500);
            }
        }

        // ============================================
        // 7. Check CHALLENGE COMPLETION achievements (307-309)
        // ============================================
        console.log('[ACHIEVEMENTS][CATCH-UP] Checking completed challenges...');

        const { count: completedChallengeCount, error: challengeError } = await supabaseServer
            .from('challenges')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('completed', true);

        if (challengeError) {
            console.error('[ACHIEVEMENTS][CATCH-UP] Error counting challenges:', challengeError);
            errors.push(`Challenge count error: ${challengeError.message}`);
        } else {
            console.log(`[ACHIEVEMENTS][CATCH-UP] User has completed ${completedChallengeCount || 0} challenges`);

            // Challenge Achievements (307-309)
            if (completedChallengeCount && completedChallengeCount >= 5) {
                await unlockAchievement('307', null, 'Challenge Seeker', 'Embrace difficulty. Complete 5 challenges.', 100, 50);
            }
            if (completedChallengeCount && completedChallengeCount >= 15) {
                await unlockAchievement('308', null, 'Challenge Conqueror', 'Obstacles fuel your resolve. Complete 15 challenges.', 250, 125);
            }
            if (completedChallengeCount && completedChallengeCount >= 30) {
                await unlockAchievement('309', null, 'Challenge Legend', 'Nothing stands in your way. Complete 30 challenges.', 500, 250);
            }
        }

        console.log(`[ACHIEVEMENTS][CATCH-UP] Completed. Newly unlocked: ${unlockedAchievements.length}`);

        return NextResponse.json({
            success: true,
            checked: {
                friends: friendCount || 0,
                questsSent: sentQuestCount || 0,
                tiles: tileCounts?.length || 0,
                questsCompleted: completedQuestCount || 0,
                challengesCompleted: completedChallengeCount || 0,
                level: characterStats?.level || 1,
                gold: characterStats?.gold || 0
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
