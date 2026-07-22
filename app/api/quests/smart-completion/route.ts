import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';
import { formatDate, getToday } from '@/lib/date-utils';
import { grantReward } from '@/app/api/kingdom/grantReward';
import { comprehensiveItems } from '@/app/lib/comprehensive-items';

// This endpoint is used by the "Bulk Complete All" feature in the frontend.
// It handles marking a quest as complete intelligently (checking for existing completions, etc.)

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { questId, completed = true } = body;

        logger.debug('[Smart Completion v2] Processing request for quest:', { questId, completed });

        if (!questId) {
            return NextResponse.json({ error: 'Quest ID is required' }, { status: 400 });
        }

        // Use authenticated query to ensure user context is set (RLS)
        const result = await authenticatedSupabaseQuery(req, async (supabase, userId) => {
            // Fetch daily streak to calculate multiplier
            let streakDays = 0;
            try {
                const { data: streakData } = await supabase
                    .from('streaks')
                    .select('current_streak')
                    .eq('user_id', userId)
                    .maybeSingle();
                if (streakData) {
                    streakDays = streakData.current_streak || 0;
                }
            } catch (err) {
                logger.warn('[Smart Completion] Failed to fetch streak:', err);
            }
            const streakMultiplier = 1 + Math.min(1.0, streakDays * 0.1);

            // 1. Fetch the quest to get rewards info
            const { data: quest, error: questError } = await supabase
                .from('quests')
                .select('*')
                .eq('id', questId)
                .single();

            if (questError || !quest) {
                // If not found in quests, check challenges (legacy support)
                const { data: challenge, error: challengeError } = await supabase
                    .from('challenges')
                    .select('*')
                    .eq('id', questId)
                    .single();

                if (challengeError || !challenge) {
                    throw new Error('Quest not found');
                }

                // 2. Check if already completed TODAY
                const today = new Date().toISOString().split('T')[0];
                const { data: existing } = await supabase
                    .from('challenge_completion')
                    .select('*')
                    .eq('challenge_id', questId)
                    .eq('user_id', userId)
                    .eq('date', today)
                    .maybeSingle();

                if (completed) {
                    if (existing) {
                        return { success: true, completed: true, alreadyCompleted: true, message: 'Already completed today' };
                    }

                    // 3. Insert completion
                    const difficultyRewards: Record<string, { xp: number; gold: number }> = {
                        easy: { xp: 25, gold: 25 },
                        medium: { xp: 50, gold: 50 },
                        hard: { xp: 100, gold: 100 }
                    };
                    const baseRewards = difficultyRewards[challenge.difficulty || 'medium'] || { xp: 50, gold: 50 };

                    // Guardian Pet Perk Multiplier (+1% XP per pet level on matching category challenges)
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
                            const challengeCat = (challenge.category || '').toLowerCase();
                            const GUARDIAN_FOCUS_MAP: Record<string, string[]> = {
                                'ember-drake': ['might', 'agility'],
                                'sage-owl': ['knowledge', 'intelligence'],
                                'spirit-sprite': ['vitality', 'spiritual', 'wellness']
                            };
                            const focusCategories = GUARDIAN_FOCUS_MAP[petState.selectedId] || [];
                            const isMatch = focusCategories.some(fc => challengeCat.includes(fc));
                            if (isMatch) {
                                guardianPerkMultiplier = 1 + (petState.level * 0.01);
                                logger.debug(`[Guardian Perk] +${petState.level}% XP bonus on challenge (${petState.selectedId} lvl ${petState.level}, cat: ${challengeCat})`);
                            }
                        }
                    } catch (err) {
                        logger.error('[Guardian Perk] Failed to apply pet perk on challenge:', err);
                    }

                    const rewards = {
                        xp: Math.floor(baseRewards.xp * streakMultiplier * guardianPerkMultiplier),
                        gold: Math.floor(baseRewards.gold * streakMultiplier)
                    };

                    const { error: insertError } = await supabase
                        .from('challenge_completion')
                        .insert({
                            challenge_id: questId,
                            user_id: userId,
                            completed: true,
                            date: today,
                            xp_earned: rewards.xp,
                            gold_earned: rewards.gold
                        });

                    if (insertError) {
                        if (insertError.code === '23505') { // Duplicate key
                            return { success: true, alreadyCompleted: true, message: 'Race condition: already completed' };
                        }
                        throw insertError;
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
                        const categoryName = (challenge.category || 'might').toLowerCase();
                        
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
                            logger.debug(`[Airship Hook] Challenge advanced expedition: ${activeExp.progress}% -> ${newProgress}%`);
                        }
                    } catch (err) {
                        logger.error('[Airship Hook] Failed to advance active expedition:', err);
                    }

                    // Habit Focus District Hook (Challenges)
                    try {
                        const { data: focusPrefs } = await supabase
                            .from('user_preferences')
                            .select('preference_value')
                            .eq('user_id', userId)
                            .eq('preference_key', 'habit_focus_districts')
                            .maybeSingle();

                        const allDistricts = (focusPrefs?.preference_value as any) || {};
                        const categoryName = (challenge.category || 'might').toLowerCase();
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

                    // Habit Guardian XP Hook (Challenges)
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

                    // Chronicle Filler Episodes Hook (Challenges)
                    try {
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
                                const category = (challenge.category || 'might').toLowerCase();
                                
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

                    try {
                        await grantReward({ userId, type: 'challenge', relatedId: questId, amount: rewards.xp, context: { gold: rewards.gold } });
                        await grantReward({ userId, type: 'gold', relatedId: questId, amount: rewards.gold, context: { xp: rewards.xp } });
                    } catch (rewardError) {
                        logger.error('[Smart Completion] Error granting rewards for challenge:', rewardError);
                    }

                    return { success: true, completed: true, rewards };
                } else {
                    // UNCOMPLETE CHALLENGE
                    if (existing) {
                        const revokedXP = existing.xp_earned || (challenge.xp || 50);
                        const revokedGold = existing.gold_earned || (challenge.gold || 25);

                        await supabase
                            .from('challenge_completion')
                            .delete()
                            .eq('user_id', userId)
                            .eq('challenge_id', questId)
                            .eq('date', today);

                        // Revoke stats
                        const { data: currentStats } = await supabase
                            .from('character_stats')
                            .select('*')
                            .eq('user_id', userId)
                            .single();

                        if (currentStats) {
                            await supabase
                                .from('character_stats')
                                .update({
                                    experience: Math.max(0, (currentStats.experience || 0) - revokedXP),
                                    gold: Math.max(0, (currentStats.gold || 0) - revokedGold),
                                    updated_at: new Date().toISOString()
                                })
                                .eq('user_id', userId);
                        }
                        return { success: true, completed: false };
                    }
                    return { success: true, message: 'Not completed today' };
                }
            }

            // Quest found in 'quests' table
            // 2. Check if already completed TODAY in Europe/Amsterdam timezone
            const todayStr = getToday();

            const { data: userCompletions } = await supabase
                .from('quest_completion')
                .select('*')
                .eq('quest_id', questId)
                .eq('user_id', userId);

            const existing = (userCompletions || []).find(c => {
                if (!c.completed_at && !c.created_at) return false;
                const cDate = formatDate(c.completed_at || c.created_at);
                return cDate === todayStr;
            });

            logger.info('[QUEST-BOARD-DIAGNOSTIC][POST /api/quests/smart-completion] Database lookup result', {
                questId,
                userId,
                todayAmsterdam: todayStr,
                totalCompletionsInDB: userCompletions?.length || 0,
                existingRecordFoundForToday: !!existing,
                existingRecord: existing ? { id: existing.id, completed_at: existing.completed_at, parsedDate: formatDate(existing.completed_at || existing.created_at) } : null
            });

            if (completed) {
                if (existing) {
                    logger.info('[QUEST-BOARD-DIAGNOSTIC][POST /api/quests/smart-completion] Returning alreadyCompleted: true', { questId });
                    return { success: true, completed: true, alreadyCompleted: true, message: 'Already completed today' };
                }

                // 3. Mark as complete
                const currentHour = new Date().getHours();
                const isDay = currentHour >= 6 && currentHour < 18;
                
                const difficultyRewards: Record<string, { xp: number; gold: number }> = {
                    easy: { xp: 25, gold: 25 },
                    medium: { xp: 50, gold: 50 },
                    hard: { xp: 100, gold: 100 }
                };
                const baseRewards = difficultyRewards[quest.difficulty || 'medium'] || { xp: 50, gold: 50 };
                
                // Check for First Action Bonus
                const { count: questsCompletedToday } = await supabase
                    .from('quest_completion')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', userId)
                    .gte('completed_at', todayStr);

                const isFirstAction = questsCompletedToday === 0;
                const firstActionMultiplier = isFirstAction ? 1.5 : 1.0;

                // Apply Spell blessings from Alchemy Lab
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
                    logger.error('[Smart Completion] Failed to load alchemy spell blessings:', err);
                }

                // Apply Time-of-Day, Streak, Altar spell, and First Action Bonuses
                const finalRewards = {
                    gold: Math.floor((isDay ? Math.floor(baseRewards.gold * 1.2) : baseRewards.gold) * streakMultiplier * firstActionMultiplier * goldMultiplier),
                    xp: Math.floor((!isDay ? Math.floor(baseRewards.xp * 1.2) : baseRewards.xp) * streakMultiplier * firstActionMultiplier * xpMultiplier)
                };

                const { error: insertError } = await supabase
                    .from('quest_completion')
                    .insert({
                        quest_id: questId,
                        user_id: userId,
                        completed: true,
                        completed_at: new Date().toISOString(),
                        xp_earned: finalRewards.xp,
                        gold_earned: finalRewards.gold
                    });

                if (insertError) {
                    if (insertError.code === '23505') { // Duplicate key
                        return { success: true, alreadyCompleted: true, message: 'Race condition: already completed' };
                    }
                    throw insertError;
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

                // 4. Update Character Stats
                try {
                    await grantReward({ userId, type: 'quest', relatedId: questId, amount: finalRewards.xp, context: { gold: finalRewards.gold } });
                    await grantReward({ userId, type: 'gold', relatedId: questId, amount: finalRewards.gold, context: { xp: finalRewards.xp } });
                } catch (rewardError) {
                    logger.error('[Smart Completion] Error granting rewards for quest:', rewardError);
                }

                // 5. Material Scavenging & Gem Drops (30% chance total: 10% Gems, 20% Materials)
                let scavengedMaterial = null;
                let droppedGems = 0;
                const dropRoll = Math.random();

                // Check if this is the very first quest completion ever to guarantee a drop
                const { count: completionCount } = await supabase
                    .from('quest_completion')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', userId);

                const isFirstEver = completionCount === 1;
                
                if (dropRoll < 0.10 || isFirstEver) {
                    droppedGems = isFirstEver ? 5 : (Math.floor(Math.random() * 3) + 1);
                    try {
                        await grantReward({ userId, type: 'gems', amount: droppedGems, relatedId: questId });
                    } catch (gemError) {
                        logger.error('[Smart Completion] Error granting gems:', gemError);
                    }
                } 
                
                if ((dropRoll >= 0.10 && dropRoll < 0.30) || isFirstEver) {
                    const categoryName = (quest.category || 'might').toLowerCase();
                    let materialId = 'material-logs';
                    if (['might', 'craft'].includes(categoryName)) materialId = 'material-steel';
                    else if (['knowledge', 'honor', 'castle'].includes(categoryName)) materialId = 'material-crystal';
                    else if (['exploration'].includes(categoryName)) materialId = 'material-planks';

                    const materialRef = comprehensiveItems.find(i => i.id === materialId);

                    if (materialRef) {
                        const { data: existingItem } = await supabase
                            .from('inventory_items')
                            .select('*')
                            .eq('user_id', userId)
                            .eq('item_id', materialId)
                            .maybeSingle();

                        if (existingItem) {
                            await supabase
                                .from('inventory_items')
                                .update({ quantity: (existingItem.quantity || 1) + 1 })
                                .eq('id', existingItem.id);
                        } else {
                            await supabase
                                .from('inventory_items')
                                .insert({
                                    user_id: userId,
                                    item_id: materialRef.id,
                                    name: materialRef.name,
                                    type: materialRef.type,
                                    category: materialRef.category,
                                    description: materialRef.description,
                                    emoji: materialRef.emoji,
                                    image: materialRef.image,
                                    stats: materialRef.stats || {},
                                    quantity: 1,
                                    equipped: false,
                                    is_default: false
                                });
                        }
                        scavengedMaterial = { name: materialRef.name, emoji: materialRef.emoji };
                    }
                }

                return { 
                    success: true, 
                    completed: true, 
                    rewards: finalRewards, 
                    bonusType: isDay ? 'Day (Gold)' : 'Night (XP)',
                    scavengedMaterial,
                    droppedGems,
                    isFirstAction
                };
            } else {
                // UNCOMPLETE QUEST
                if (existing) {
                    const revokedXP = existing.xp_earned || (quest.xp_reward || 50);
                    const revokedGold = existing.gold_earned || (quest.gold_reward || 25);

                    await supabase
                        .from('quest_completion')
                        .delete()
                        .eq('id', existing.id);

                    // Revoke stats
                    const { data: currentStats } = await supabase
                        .from('character_stats')
                        .select('*')
                        .eq('user_id', userId)
                        .single();

                    if (currentStats) {
                        await supabase
                            .from('character_stats')
                            .update({
                                experience: Math.max(0, (currentStats.experience || 0) - revokedXP),
                                gold: Math.max(0, (currentStats.gold || 0) - revokedGold),
                                updated_at: new Date().toISOString()
                            })
                            .eq('user_id', userId);
                    }
                    return { success: true, completed: false };
                }
                return { success: true, message: 'Not completed today' };
            }
        });

        if (!result.success) {
            // Determine status code based on error message/type
            const status = (result.error?.includes('auth') || result.error?.includes('session')) ? 401 : 500;
            return NextResponse.json({ error: result.error }, { status });
        }

        return NextResponse.json(result.data);

    } catch (error: any) {
        logger.error('[Smart Completion] Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

export async function OPTIONS(request: NextRequest) {
    return NextResponse.json({}, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
