import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { grantReward } from '@/app/api/kingdom/grantReward';
import { AllianceStreakManager } from '@/lib/alliance-streak-manager';

const supabase = createClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['SUPABASE_SERVICE_ROLE_KEY']!
)

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth()

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { questId } = body

        if (!questId) {
            return NextResponse.json({ error: 'Quest ID is required' }, { status: 400 })
        }

        // Get the quest details
        const { data: quest, error: questError } = await supabase
            .from('quests')
            .select('*')
            .eq('id', questId)
            .eq('user_id', userId)
            .single()

        if (questError || !quest) {
            logger.error('Error fetching quest:', questError)
            return NextResponse.json({ error: 'Quest not found' }, { status: 404 })
        }

        // Check if already completed TODAY in Netherlands timezone
        const todayStr = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Europe/Amsterdam',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(new Date());

        const { data: userCompletions } = await supabase
            .from('quest_completion')
            .select('id, completed_at')
            .eq('quest_id', questId)
            .eq('user_id', userId);

        const alreadyCompletedToday = (userCompletions || []).some(c => {
            if (!c.completed_at) return false;
            const cDate = new Intl.DateTimeFormat('en-CA', {
                timeZone: 'Europe/Amsterdam',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }).format(new Date(c.completed_at));
            return cDate === todayStr;
        });

        if (alreadyCompletedToday) {
            return NextResponse.json({
                message: 'Quest already completed today',
                alreadyCompleted: true
            })
        }

        // Fetch streak data for multiplier
        const { data: streakData } = await supabase
            .from('streaks')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        const currentStreak = streakData?.current_streak || 0;
        const streakMultiplier = 1 + Math.min(1.0, currentStreak * 0.1);

        // Determine rewards based on difficulty
        const difficultyRewards: Record<string, { xp: number; gold: number }> = {
            easy: { xp: 25, gold: 25 },
            medium: { xp: 50, gold: 50 },
            hard: { xp: 100, gold: 100 }
        }

        const baseRewards = difficultyRewards[quest.difficulty || 'medium'] || { xp: 50, gold: 50 }

        // Check active alchemy spell blessings
        let xpMultiplier = 1;
        let goldMultiplier = 1;
        try {
            const { data: prefData } = await supabase
                .from('user_preferences')
                .select('preference_value')
                .eq('user_id', userId)
                .eq('preference_key', 'active_alchemy_buffs')
                .maybeSingle();

            const activeBuffs = (prefData?.preference_value as any) || {};
            if (activeBuffs.activeSpell === 'swiftness' && activeBuffs.spellExpiresAt && new Date(activeBuffs.spellExpiresAt).getTime() > Date.now()) {
                xpMultiplier = 2;
            }
            if (activeBuffs.activeSpell === 'greed' && activeBuffs.spellExpiresAt && new Date(activeBuffs.spellExpiresAt).getTime() > Date.now()) {
                goldMultiplier = 2;
            }
        } catch (err) {
            logger.error('[Quest Complete API] Failed to load alchemy spell blessings:', err);
        }

        // Guardian Pet Perk Multiplier (+1% XP per pet level on matching category quests)
        let guardianPerkMultiplier = 1;
        try {
            const { data: petPref } = await supabase
                .from('user_preferences')
                .select('preference_value')
                .eq('user_id', userId)
                .eq('preference_key', 'habit_guardian_state')
                .maybeSingle();

            const petState = (petPref?.preference_value as any);
            if (petState && petState.selectedId && petState.level > 1) {
                const questCat = (quest.category || '').toLowerCase();
                const GUARDIAN_FOCUS_MAP: Record<string, string[]> = {
                    'ember-drake': ['might', 'agility'],
                    'sage-owl': ['knowledge', 'intelligence'],
                    'spirit-sprite': ['vitality', 'spiritual', 'wellness']
                };
                const focusCategories = GUARDIAN_FOCUS_MAP[petState.selectedId] || [];
                const isMatch = focusCategories.some(fc => questCat.includes(fc));
                if (isMatch) {
                    guardianPerkMultiplier = 1 + (petState.level * 0.01);
                    logger.debug(`[Guardian Perk] +${petState.level}% XP bonus applied (${petState.selectedId} lvl ${petState.level}, quest cat: ${questCat})`);
                }
            }
        } catch (err) {
            logger.error('[Guardian Perk] Failed to apply pet perk:', err);
        }

        const rewards = {
            xp: Math.floor(baseRewards.xp * streakMultiplier * xpMultiplier * guardianPerkMultiplier),
            gold: Math.floor(baseRewards.gold * streakMultiplier * goldMultiplier)
        }

        // Mark quest as complete
        const { error: completionError } = await supabase
            .from('quest_completion')
            .insert({
                quest_id: questId,
                user_id: userId,
                completed: true,
                completed_at: new Date().toISOString(),
                xp_earned: rewards.xp,
                gold_earned: rewards.gold
            })

        if (completionError) {
            logger.error('Error marking quest complete:', completionError)
            return NextResponse.json({ error: 'Failed to complete quest' }, { status: 500 })
        }

        // Airship Voyage Progress Hook
        try {
            const { data: prefData } = await supabase
                .from('user_preferences')
                .select('preference_value')
                .eq('user_id', userId)
                .eq('preference_key', 'active_expeditions')
                .maybeSingle();

            const activeExp = (prefData?.preference_value as any);
            const categoryName = (quest.category || 'might').toLowerCase();
            
            const isCategoryMatch = (qc: string, jc: string): boolean => {
                if (jc === 'knowledge') return qc.includes('knowledge') || qc.includes('intelligence');
                if (jc === 'might') return qc.includes('might') || qc.includes('agility');
                if (jc === 'wellness') return qc.includes('wellness') || qc.includes('vitality') || qc.includes('spiritual');
                if (jc === 'social') return qc.includes('social') || qc.includes('creative');
                return qc.includes(jc);
            };

            if (activeExp && activeExp.active && isCategoryMatch(categoryName, activeExp.category) && activeExp.progress < 100) {
                const newProgress = Math.min(100, activeExp.progress + 20);
                await supabase
                    .from('user_preferences')
                    .upsert({
                        user_id: userId,
                        preference_key: 'active_expeditions',
                        preference_value: { ...activeExp, progress: newProgress },
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'user_id,preference_key' });
                logger.debug(`[Airship Hook] Quest advanced expedition: ${activeExp.progress}% -> ${newProgress}%`);
            }
        } catch (err) {
            logger.error('[Airship Hook] Failed to advance active expedition:', err);
        }

        // Habit Focus District Hook
        try {
            const { data: focusPrefs } = await supabase
                .from('user_preferences')
                .select('preference_value')
                .eq('user_id', userId)
                .eq('preference_key', 'habit_focus_districts')
                .maybeSingle();

            const allDistricts = (focusPrefs?.preference_value as any) || {};
            const categoryName = (quest.category || 'might').toLowerCase();
            let updated = false;

            Object.keys(allDistricts).forEach(key => {
                const dist = allDistricts[key];
                if (!dist) return;

                const matches = dist.categories.some((cat: string) => {
                    const jc = cat.toLowerCase();
                    const qCat = categoryName.toLowerCase();
                    if (jc === qCat) return true;
                    if (jc === 'knowledge' && (qCat.includes('knowledge') || qCat.includes('intelligence'))) return true;
                    if (jc === 'might' && (qCat.includes('might') || qCat.includes('agility'))) return true;
                    if (jc === 'vitality' && (qCat.includes('vitality') || qCat.includes('wellness') || qCat.includes('spiritual'))) return true;
                    return qCat.includes(jc) || jc.includes(qCat);
                });

                if (dist.locationType === 'settlement') {
                    if (dist.boundHabitId === questId) {
                        dist.streak = (dist.streak || 0) + 1;
                        dist.taxGold = (dist.taxGold || 0) + 50 * dist.streak;
                        updated = true;
                    }
                } else if (matches) {
                    if (dist.locationType === 'town') {
                        const expires = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
                        dist.discountUntil = expires;
                        updated = true;
                    } else if (dist.locationType === 'city') {
                        dist.guildCharges = Math.min(5, (dist.guildCharges || 0) + 1);
                        updated = true;
                    } else if (dist.locationType === 'megapolis') {
                        dist.monumentProgress = Math.min(10, (dist.monumentProgress || 0) + 1);
                        updated = true;
                    }
                }
            });

            if (updated) {
                await supabase
                    .from('user_preferences')
                    .upsert({
                        user_id: userId,
                        preference_key: 'habit_focus_districts',
                        preference_value: allDistricts,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'user_id,preference_key' });
                logger.debug('[Focus Hook] Advanced habit focus districts state.');
            }
        } catch (err) {
            logger.error('[Focus Hook] Failed to advance focus districts:', err);
        }

        // Habit Guardian XP Hook
        try {
            const { data: petPref } = await supabase
                .from('user_preferences')
                .select('preference_value')
                .eq('user_id', userId)
                .eq('preference_key', 'habit_guardian_state')
                .maybeSingle();

            const petState = (petPref?.preference_value as any);
            if (petState && petState.selectedId) {
                let newXP = (petState.experience || 0) + 15;
                let newLvl = petState.level || 1;
                const xpReq = newLvl * 100;
                if (newXP >= xpReq) {
                    newXP -= xpReq;
                    newLvl += 1;
                }
                await supabase
                    .from('user_preferences')
                    .upsert({
                        user_id: userId,
                        preference_key: 'habit_guardian_state',
                        preference_value: { ...petState, experience: newXP, level: newLvl },
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'user_id,preference_key' });
                logger.debug(`[Guardian Hook] Awarded XP: level ${newLvl}, xp ${newXP}`);
            }
        } catch (err) {
            logger.error('[Guardian Hook] Failed to award pet XP:', err);
        }

        // Chronicle Filler Episodes Hook
        try {
            // Check if filler episodes are enabled
            const { data: fillerPref } = await supabase
                .from('user_preferences')
                .select('preference_value')
                .eq('user_id', userId)
                .eq('preference_key', 'enable_chronicle_filler')
                .maybeSingle();

            const isFillerEnabled = fillerPref ? fillerPref.preference_value !== false : true;

            if (isFillerEnabled) {
                const { data: countPref } = await supabase
                    .from('user_preferences')
                    .select('preference_value')
                    .eq('user_id', userId)
                    .eq('preference_key', 'total_habit_completions')
                    .maybeSingle();

                const currentCount = typeof countPref?.preference_value === 'number' ? countPref.preference_value : 0;
                const newCount = currentCount + 1;

                await supabase
                    .from('user_preferences')
                    .upsert({
                        user_id: userId,
                        preference_key: 'total_habit_completions',
                        preference_value: newCount,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'user_id,preference_key' });

                if (newCount % 3 === 0) {
                    const category = (quest.category || 'might').toLowerCase();
                    
                    const templates: Record<string, string[]> = {
                        might: [
                            "Working at the Blacksmith anvil alongside Ignisio, the leader forged iron wall braces for the north tower.",
                            "The leader completed a grueling obstacle course around Castle Valoreth, sharpening their combat reflexes and stamina.",
                            "A patrol through the wild outskirts of Thrivehaven tested the leader's endurance, keeping Necrion's beasts at bay."
                        ],
                        knowledge: [
                            "By helping Archmage Silvo organize ancient scrolls in the citadel library, the leader restored order to the archives.",
                            "The leader spent the evening observing stars from the high watchtower, drawing cosmic maps for the Airship crew.",
                            "A deep study of local flora expanded the leader's knowledge, discovering new elixir ingredients for the Alchemist Cauldron."
                        ],
                        honor: [
                            "Standing guard at the outer gates of Castle Valoreth, the leader protected wandering merchants arriving from Sunspire.",
                            "The leader assisted returning citizens with repairing the town fountain, earning the respect of the elders.",
                            "By helping town guards secure the gates of Castle Valoreth, the leader earned the respect of Queen Valandriel's envoys."
                        ],
                        castle: [
                            "With stone and mortar, the leader cleared the rubble of the north tower, reinforcing Castle Valoreth against winter storms.",
                            "The leader organized the granary storage chambers, ensuring the town's food supplies were locked and preserved.",
                            "The leader inspected the dungeon masonry, dusting off old floors and securing secret passages under the fortress."
                        ],
                        craft: [
                            "Sweeping away the ash from the blacksmith forge, the leader shaped raw ingots into sturdy tools for town craftsmen.",
                            "With seasoned oak planks and leather straps, the leader built cargo chests for the Airship Harbor's next expedition.",
                            "The leader drafted detailed blueprints for a new watermill, preparing wood planks for Flippur's waterway project."
                        ],
                        vitality: [
                            "Tending the herbal gardens alongside Seqoio, the leader gathered fresh roots to nourish the town's citizens.",
                            "A peaceful walk through the Whispering Canopy allowed the leader to center their mind and regain strength.",
                            "The leader prepared a warm soup of wild herbs by the hearth, soothing tired muscles after days of hard work."
                        ]
                    };

                    const list = templates[category] || templates['might']!;
                    const content = list[Math.floor(Math.random() * list.length)]!;

                    const { data: statsData } = await supabase
                        .from('character_stats')
                        .select('level')
                        .eq('user_id', userId)
                        .single();

                    const playerLevel = statsData?.level || 1;
                    let activeChapterId = 1;
                    if (playerLevel >= 70) activeChapterId = 8;
                    else if (playerLevel >= 60) activeChapterId = 7;
                    else if (playerLevel >= 50) activeChapterId = 6;
                    else if (playerLevel >= 40) activeChapterId = 5;
                    else if (playerLevel >= 30) activeChapterId = 4;
                    else if (playerLevel >= 20) activeChapterId = 3;
                    else if (playerLevel >= 10) activeChapterId = 2;

                    const { data: fillPref } = await supabase
                        .from('user_preferences')
                        .select('preference_value')
                        .eq('user_id', userId)
                        .eq('preference_key', 'chronicle_filler_episodes')
                        .maybeSingle();

                    const listEp = Array.isArray(fillPref?.preference_value) ? fillPref.preference_value : [];
                    const newEpisode = {
                        id: `filler-${Date.now()}`,
                        date: new Date().toISOString().split('T')[0],
                        chapterId: activeChapterId,
                        category: category.toUpperCase(),
                        content
                    };

                    await supabase
                        .from('user_preferences')
                        .upsert({
                            user_id: userId,
                            preference_key: 'chronicle_filler_episodes',
                            preference_value: [...listEp, newEpisode],
                            updated_at: new Date().toISOString()
                        }, { onConflict: 'user_id,preference_key' });
                    logger.debug('[Chronicle Hook] Added new filler episode.');
                }
            }
        } catch (err) {
            logger.error('[Chronicle Hook] Failed to progress filler episodes:', err);
        }

        // Update character stats
        const { data: currentStats, error: statsError } = await supabase
            .from('character_stats')
            .select('*')
            .eq('user_id', userId)
            .single()

        if (statsError && statsError.code !== 'PGRST116') {
            logger.error('Error fetching character stats:', statsError)
        }

        const currentLevel = currentStats?.level || 1
        const currentXP = currentStats?.experience || 0
        const currentGold = currentStats?.gold || 0
        const xpToNextLevel = currentStats?.experience_to_next_level || 100

        const newXP = currentXP + rewards.xp
        const newGold = currentGold + rewards.gold

        // Check for level up
        let newLevel = currentLevel
        let remainingXP = newXP
        let newXPToNextLevel = xpToNextLevel

        if (newXP >= xpToNextLevel) {
            newLevel = currentLevel + 1
            remainingXP = newXP - xpToNextLevel
            newXPToNextLevel = Math.floor(xpToNextLevel * 1.5) // 50% increase per level
        }

        // Update stats
        const { error: updateError } = await supabase
            .from('character_stats')
            .upsert({
                user_id: userId,
                level: newLevel,
                experience: remainingXP,
                experience_to_next_level: newXPToNextLevel,
                gold: newGold,
                focus_points: (currentStats?.focus_points || 0) + 1,
                updated_at: new Date().toISOString()
            })

        if (updateError) {
            logger.error('Error updating character stats:', updateError)
            return NextResponse.json({ error: 'Failed to update stats' }, { status: 500 })
        }

        const lastCompletionDate = streakData?.last_completion_date
        const currentStreakVal = streakData?.current_streak || 0

        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        yesterday.setHours(0, 0, 0, 0)

        let newStreak = currentStreakVal

        if (!lastCompletionDate) {
            newStreak = 1
        } else {
            const lastDate = new Date(lastCompletionDate)
            lastDate.setHours(0, 0, 0, 0)

            if (lastDate.getTime() === yesterday.getTime()) {
                newStreak = currentStreakVal + 1
            } else if (lastDate.getTime() < yesterday.getTime()) {
                newStreak = 1 // Reset streak
            }
            // If same day, keep current streak
        }

        await supabase
            .from('streaks')
            .upsert({
                user_id: userId,
                current_streak: newStreak,
                last_completion_date: todayStr,
                updated_at: new Date().toISOString()
            })

        // Check if this is a friend quest and notify sender
        if (quest.is_friend_quest && quest.sender_id) {
            try {
                // Mark quest as completed and notified
                await supabase
                    .from('quests')
                    .update({
                        completed_at: new Date().toISOString(),
                        completion_notified: true
                    })
                    .eq('id', questId);

                // Get sender and recipient info
                const { data: senderData } = await supabase
                    .from('character_stats')
                    .select('user_id')
                    .eq('user_id', quest.sender_id)
                    .single();

                if (senderData) {
                    // Send notification to sender
                    await supabase
                        .from('notifications')
                        .insert({
                            user_id: quest.sender_id,
                            type: 'friend_quest_completed',
                            data: {
                                questId: questId,
                                questName: quest.name,
                                completedBy: userId,
                                completedAt: new Date().toISOString()
                            }
                        });
                }

                // Update alliance streak for completing friend quest
                
                const streakManager = new AllianceStreakManager(supabase);
                await streakManager.updateStreak(userId);
            } catch (notifyError) {
                logger.error('Error notifying sender:', notifyError);
                // Don't fail the whole request if notification fails
            }
        }

        return NextResponse.json({
            success: true,
            rewards,
            levelUp: newLevel > currentLevel,
            newLevel,
            newXP: remainingXP,
            newGold,
            newStreak
        })
    } catch (error) {
        logger.error('Error in /api/quests/complete:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
