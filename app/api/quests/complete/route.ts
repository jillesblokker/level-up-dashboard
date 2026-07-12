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

        // Check if already completed today
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayStr = today.toISOString().split('T')[0]

        const { data: existingCompletion } = await supabase
            .from('quest_completion')
            .select('id')
            .eq('quest_id', questId)
            .eq('user_id', userId)
            .gte('completed_at', todayStr)
            .single()

        if (existingCompletion) {
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

        const rewards = {
            xp: Math.floor(baseRewards.xp * streakMultiplier * xpMultiplier),
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
                    if (jc === 'knowledge') return categoryName.includes('knowledge') || categoryName.includes('intelligence');
                    if (jc === 'might') return categoryName.includes('might') || categoryName.includes('agility');
                    if (jc === 'wellness') return categoryName.includes('wellness') || categoryName.includes('vitality') || categoryName.includes('spiritual');
                    if (jc === 'social') return categoryName.includes('social') || categoryName.includes('creative');
                    return categoryName.includes(jc);
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
