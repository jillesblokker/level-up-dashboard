import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';
import { formatDate, getToday } from '@/lib/date-utils';
import { grantReward } from '@/app/api/kingdom/grantReward';
import { comprehensiveItems } from '@/app/lib/comprehensive-items';

// This endpoint is used by the "Bulk Complete All" feature in the frontend.
// It handles marking a quest as complete intelligently (checking for existing completions, etc.)

export async function GET() {
    return NextResponse.json({ status: 'ok', endpoint: 'quests/smart-completion' });
}

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
function toValidUUID(str: string): string {
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)) {
        return str;
    }
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(12, '0');
    return `00000000-0000-4000-8000-${hex.slice(0, 12)}`;
}

            const streakMultiplier = 1 + Math.min(1.0, streakDays * 0.1);

            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(questId));
            let fetchedQuest = null;
            if (isUuid) {
                const { data } = await supabase
                    .from('quests')
                    .select('*')
                    .eq('id', questId)
                    .maybeSingle();
                fetchedQuest = data;
            } else {
                const { data } = await supabase
                    .from('quests')
                    .select('*')
                    .ilike('name', questId)
                    .maybeSingle();
                fetchedQuest = data;
            }

            let quest = fetchedQuest;
            let isChallengeTarget = false;
            if (!quest) {
                let challenge = null;
                if (isUuid) {
                    const { data } = await supabase
                        .from('challenges')
                        .select('*')
                        .eq('id', questId)
                        .maybeSingle();
                    challenge = data;
                } else {
                    const { data } = await supabase
                        .from('challenges')
                        .select('*')
                        .ilike('name', questId)
                        .maybeSingle();
                    challenge = data;
                }

                if (challenge) {
                    isChallengeTarget = true;
                    quest = {
                        id: challenge.id,
                        name: challenge.name || challenge.title || 'Quest',
                        category: challenge.category || 'Might',
                        difficulty: challenge.difficulty || 'medium',
                        xp_reward: challenge.xp || 50,
                        gold_reward: challenge.gold || 25
                    };
                } else {
                    // Create dynamic fallback object for user-created custom quest
                    quest = {
                        id: questId,
                        name: 'Custom Quest',
                        category: 'Might',
                        difficulty: 'medium',
                        xp_reward: body.xpReward || 50,
                        gold_reward: body.goldReward || 25
                    };
                }
            }

            if (isChallengeTarget) {
                // 2. Check if already completed TODAY for challenges
                const today = new Date().toISOString().split('T')[0];
                const { data: existingChallenge } = await supabase
                    .from('challenge_completion')
                    .select('*')
                    .eq('challenge_id', questId)
                    .eq('user_id', userId)
                    .eq('date', today)
                    .maybeSingle();

                if (completed) {
                    if (existingChallenge) {
                        return { success: true, completed: true, alreadyCompleted: true, message: 'Already completed today' };
                    }

                    // 3. Insert completion into challenge_completion (without invalid gold_earned/xp_earned columns)
                    const difficultyRewards: Record<string, { xp: number; gold: number }> = {
                        easy: { xp: 25, gold: 25 },
                        medium: { xp: 50, gold: 50 },
                        hard: { xp: 100, gold: 100 }
                    };
                    const baseRewards = difficultyRewards[quest.difficulty || 'medium'] || { xp: 50, gold: 50 };
                    const rewards = {
                        xp: Math.floor(baseRewards.xp * streakMultiplier),
                        gold: Math.floor(baseRewards.gold * streakMultiplier)
                    };

                    const { error: insertError } = await supabase
                        .from('challenge_completion')
                        .insert({
                            challenge_id: questId,
                            user_id: userId,
                            completed: true,
                            date: today,
                            completed_at: new Date().toISOString(),
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
                            if (jc === 'knowledge' || jc === 'pilgrimage-knowledge') return qc.includes('know') || qc.includes('intel') || qc.includes('read') || qc.includes('study') || qc.includes('learn');
                            if (jc === 'might' || jc === 'march-might') return qc.includes('might') || qc.includes('agil') || qc.includes('craft') || qc.includes('strength');
                            if (jc === 'wellness' || jc === 'trail-wellness') return qc.includes('well') || qc.includes('vital') || qc.includes('spirit');
                            if (jc === 'social' || jc === 'social-bonds') return qc.includes('social') || qc.includes('creat') || qc.includes('honor');
                            return true;
                        };

                        if (activeExp && activeExp.active && activeExp.progress < 100) {
                            const advanceAmount = isCategoryMatch(categoryName, activeExp.category || activeExp.journeyId || '') ? 30 : 25;
                            const newProgress = Math.min(100, activeExp.progress + advanceAmount);
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

                    try {
                        await grantReward({ userId, type: 'challenge', relatedId: questId, amount: rewards.xp, context: { gold: rewards.gold } });
                        await grantReward({ userId, type: 'gold', relatedId: questId, amount: rewards.gold, context: { xp: rewards.xp } });
                    } catch (rewardError) {
                        logger.error('[Smart Completion] Error granting rewards for challenge:', rewardError);
                    }

                    return { success: true, completed: true, rewards };
                } else {
                    // UNCOMPLETE CHALLENGE
                    if (existingChallenge) {
                        const revokedXP = existingChallenge.xp_earned || (quest.xp_reward || 50);
                        const revokedGold = existingChallenge.gold_earned || (quest.gold_reward || 25);

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
            const requestTz = req.headers.get('x-timezone') || undefined;
            const todayStr = getToday(requestTz);

            const possibleQuestIds = Array.from(new Set([
                String(questId),
                String(quest?.id || ''),
                String(quest?.name || ''),
                String(questId).toLowerCase(),
                String(quest?.name || '').toLowerCase()
            ].filter(Boolean)));

            const { data: allUserCompletions } = await supabase
                .from('quest_completion')
                .select('*')
                .eq('user_id', userId);

            const userCompletions = (allUserCompletions || []).filter(c => 
                possibleQuestIds.includes(String(c.quest_id)) || 
                possibleQuestIds.includes(String(c.quest_id).toLowerCase())
            );

            const existing = userCompletions.find(c => {
                if (!c.completed_at && !c.created_at) return false;
                const cDate = formatDate(c.completed_at || c.created_at, requestTz);
                const nowMs = Date.now();
                const compMs = new Date(c.completed_at || c.created_at).getTime();
                const isRecent = !isNaN(compMs) && (nowMs - compMs) < (24 * 60 * 60 * 1000);
                return cDate === todayStr || isRecent;
            });

            logger.info('[QUEST-BOARD-DIAGNOSTIC][POST /api/quests/smart-completion] Database lookup result', {
                questId,
                userId,
                todayAmsterdam: todayStr,
                totalCompletionsInDB: allUserCompletions?.length || 0,
                matchedCompletionsCount: userCompletions.length,
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

                // Apply active potion modifiers and Alchemy Lab spell blessings
                let xpMultiplier = 1;
                let goldMultiplier = 1;
                try {
                    const nowIso = new Date().toISOString();
                    const { data: activeMods } = await supabase
                        .from('active_modifiers')
                        .select('name')
                        .eq('user_id', userId)
                        .gt('expires_at', nowIso);

                    const modList = activeMods || [];
                    const isFocusActive = modList.some(m => m.name === 'Elixir of Focus');
                    const isDreadActive = modList.some(m => m.name === 'Dread Tonic');
                    const isMidasActive = modList.some(m => m.name === 'Midas Draught');
                    const isSageActive = modList.some(m => m.name === 'Sage Brew');

                    const modGoldMult = isMidasActive ? 2.0 : (isDreadActive ? 1.50 : 1.0);
                    const modXpMult = isSageActive ? 1.50 : (isFocusActive ? 1.25 : 1.0);

                    const { data: prefData } = await supabase
                        .from('user_preferences')
                        .select('preference_value')
                        .eq('user_id', userId)
                        .eq('preference_key', 'active_alchemy_buffs')
                        .maybeSingle();

                    const activeBuffs = (prefData?.preference_value as any) || {};
                    let spellXpMult = 1;
                    let spellGoldMult = 1;
                    if (activeBuffs.activeSpell === 'swiftness' && activeBuffs.spellExpiresAt && new Date(activeBuffs.spellExpiresAt).getTime() > Date.now()) {
                        spellXpMult = 2;
                    }
                    if (activeBuffs.activeSpell === 'greed' && activeBuffs.spellExpiresAt && new Date(activeBuffs.spellExpiresAt).getTime() > Date.now()) {
                        spellGoldMult = 2;
                    }

                    goldMultiplier = modGoldMult * spellGoldMult;
                    xpMultiplier = modXpMult * spellXpMult;
                } catch (err) {
                    logger.error('[Smart Completion] Failed to load alchemy buffs & modifiers:', err);
                }

                // Apply Time-of-Day, Streak, Altar spell, and First Action Bonuses
                const finalRewards = {
                    gold: Math.floor((isDay ? Math.floor(baseRewards.gold * 1.2) : baseRewards.gold) * streakMultiplier * firstActionMultiplier * goldMultiplier),
                    xp: Math.floor((!isDay ? Math.floor(baseRewards.xp * 1.2) : baseRewards.xp) * streakMultiplier * firstActionMultiplier * xpMultiplier)
                };

                const rawQuestIdStr = String(quest.id || questId);

                const insertPayload = {
                    quest_id: rawQuestIdStr,
                    user_id: userId,
                    completed: true,
                    completed_at: new Date().toISOString(),
                    xp_earned: finalRewards.xp,
                    gold_earned: finalRewards.gold,
                };

                logger.warn('[QUEST-PERSIST-DIAG] Inserting quest_completion row:', JSON.stringify(insertPayload));

                const { error: insertError } = await supabase
                    .from('quest_completion')
                    .insert(insertPayload);

                if (insertError) {
                    logger.warn('[QUEST-PERSIST-DIAG] Insert error:', JSON.stringify({ code: (insertError as any).code, message: insertError.message, details: (insertError as any).details }));
                    if ((insertError as any).code === '23505') { // Duplicate key
                        return { success: true, alreadyCompleted: true, message: 'Race condition: already completed' };
                    }
                    throw insertError;
                }

                logger.warn('[QUEST-PERSIST-DIAG] Insert SUCCESS for quest:', quest.name || questId);

                // Record House Cup (+1 point for Quest completion, +10 for Friend Quest Dares to both recipient & sender)
                try {
                    const { recordHouseCupPoints } = await import('@/lib/house-cup-service');
                    const isFriendQuest = !!quest.is_friend_quest;
                    const pointsToAward = isFriendQuest ? 10 : 1;
                    const sourceType = isFriendQuest ? 'challenge' : 'quest';

                    // 1. Recipient (completer)
                    await recordHouseCupPoints({
                        userId,
                        categoryId: quest.category || 'might',
                        sourceType: sourceType,
                        sourceId: questId,
                        points: pointsToAward,
                    });

                    // 2. Sender (if friend quest dare)
                    if (isFriendQuest && quest.sender_id && quest.sender_id !== userId) {
                        await recordHouseCupPoints({
                            userId: quest.sender_id,
                            categoryId: quest.category || 'might',
                            sourceType: sourceType,
                            sourceId: questId,
                            points: pointsToAward,
                        });
                    }
                } catch (houseCupErr) {
                    logger.error('[Smart Completion] House Cup points record error:', houseCupErr);
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
                        if (jc === 'knowledge' || jc === 'pilgrimage-knowledge') return qc.includes('know') || qc.includes('intel') || qc.includes('read') || qc.includes('study') || qc.includes('learn');
                        if (jc === 'might' || jc === 'march-might') return qc.includes('might') || qc.includes('agil') || qc.includes('craft') || qc.includes('strength');
                        if (jc === 'wellness' || jc === 'trail-wellness') return qc.includes('well') || qc.includes('vital') || qc.includes('spirit');
                        if (jc === 'social' || jc === 'social-bonds') return qc.includes('social') || qc.includes('creat') || qc.includes('honor');
                        return true;
                    };

                    if (activeExp && activeExp.active && activeExp.progress < 100) {
                        const advanceAmount = isCategoryMatch(categoryName, activeExp.category || activeExp.journeyId || '') ? 30 : 25;
                        const newProgress = Math.min(100, activeExp.progress + advanceAmount);
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

                    const isFillerEnabled = (fillerPref as any)?.preference_value !== false;

                    if (isFillerEnabled) {
                        const { data: countPref } = await supabase
                            .from('user_preferences')
                            .select('preference_value')
                            .eq('user_id', userId)
                            .eq('preference_key', 'total_habit_completions')
                            .maybeSingle();

                        const currentCount = typeof (countPref as any)?.preference_value === 'number' ? (countPref as any).preference_value : 0;
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

                            const listEp = Array.isArray((fillPref as any)?.preference_value) ? (fillPref as any).preference_value : [];
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

                        const mat = materialRef as any;
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
                                    item_id: mat.id,
                                    name: mat.name,
                                    type: mat.type,
                                    category: mat.category,
                                    description: mat.description,
                                    emoji: mat.emoji,
                                    image: mat.image,
                                    stats: mat.stats || {},
                                    quantity: 1,
                                    equipped: false,
                                    is_default: false
                                });
                        }
                        scavengedMaterial = { name: mat.name, emoji: mat.emoji };
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

                    logger.info('[QUEST-UNDO] Successfully deleted completion record from Supabase', { questId, completionId: existing.id, userId });

                    // Record House Cup (-1 point for Quest un-completion)
                    try {
                        const { recordHouseCupPoints } = await import('@/lib/house-cup-service');
                        await recordHouseCupPoints({
                            userId,
                            categoryId: quest.category || 'might',
                            sourceType: 'quest',
                            sourceId: questId,
                            points: -1,
                            reversalOfId: existing.id,
                        });
                    } catch (houseCupErr) {
                        logger.error('[Smart Completion] House Cup points revocation error:', houseCupErr);
                    }

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
            const status = (result.error?.includes('auth') || result.error?.includes('session')) ? 401 : 500;
            return NextResponse.json({ error: result.error }, { status });
        }

        return NextResponse.json(result);

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
