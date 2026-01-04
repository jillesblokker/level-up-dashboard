import { createClient } from '@supabase/supabase-js';

export type AchievementType =
    | 'first_friend'
    | 'five_friends'
    | 'ten_friends'
    | 'first_quest_sent'
    | 'five_quests_sent'
    | 'ten_quests_sent';

export interface AchievementDefinition {
    id: AchievementType;
    dbId: string; // Database ID for the achievements table
    title: string;
    description: string;
    icon: string;
    image: string;
    requirement: number;
    reward: {
        xp: number;
        gold: number;
        title?: string;
    };
}

// Map achievement types to their database IDs (from achievement_definitions)
export const ACHIEVEMENTS: Record<AchievementType, AchievementDefinition> = {
    first_friend: {
        id: 'first_friend',
        dbId: '107', // Maps to 'First Alliance' in achievement_definitions
        title: 'New Alliance',
        description: 'Add your first friend',
        icon: 'UserPlus',
        image: '/images/achievements/107.png',
        requirement: 1,
        reward: { xp: 50, gold: 10 }
    },
    five_friends: {
        id: 'five_friends',
        dbId: '108', // Maps to 'Guild Founder' in achievement_definitions
        title: 'Popular Companion',
        description: 'Add 5 friends',
        icon: 'Users',
        image: '/images/achievements/108.png',
        requirement: 5,
        reward: { xp: 200, gold: 50, title: 'Companion' }
    },
    ten_friends: {
        id: 'ten_friends',
        dbId: '109', // Maps to 'Fellowship Leader' in achievement_definitions
        title: 'Guild Leader',
        description: 'Add 10 friends',
        icon: 'Crown',
        image: '/images/achievements/109.png',
        requirement: 10,
        reward: { xp: 500, gold: 100, title: 'Leader' }
    },
    first_quest_sent: {
        id: 'first_quest_sent',
        dbId: '110', // Maps to 'Quest Giver' in achievement_definitions
        title: 'Quest Giver',
        description: 'Send your first quest to a friend',
        icon: 'Scroll',
        image: '/images/achievements/110.png',
        requirement: 1,
        reward: { xp: 50, gold: 10 }
    },
    five_quests_sent: {
        id: 'five_quests_sent',
        dbId: '111', // Maps to 'Master Strategist' in achievement_definitions
        title: 'Task Master',
        description: 'Send 5 quests to friends',
        icon: 'ScrollText',
        image: '/images/achievements/111.png',
        requirement: 5,
        reward: { xp: 200, gold: 50 }
    },
    ten_quests_sent: {
        id: 'ten_quests_sent',
        dbId: '112', // Maps to 'Grand Questmaster' in achievement_definitions
        title: 'Grand Questmaster',
        description: 'Send 10 quests to friends',
        icon: 'BookOpen',
        image: '/images/achievements/112.png',
        requirement: 10,
        reward: { xp: 500, gold: 100, title: 'Questmaster' }
    }
};

export class AchievementManager {
    private supabase;

    constructor(supabaseClient: any) {
        this.supabase = supabaseClient;
    }

    async checkAndUnlock(userId: string, type: AchievementType, currentCount: number): Promise<boolean> {
        const definition = ACHIEVEMENTS[type];
        if (!definition) return false;

        if (currentCount >= definition.requirement) {
            // Check if already unlocked in alliance_achievements
            const { data: existing } = await this.supabase
                .from('alliance_achievements')
                .select('*')
                .eq('user_id', userId)
                .eq('achievement_type', type)
                .single();

            if (!existing) {
                // Unlock in alliance_achievements table
                await this.supabase
                    .from('alliance_achievements')
                    .insert({
                        user_id: userId,
                        achievement_type: type,
                        progress: currentCount,
                        unlocked_at: new Date().toISOString()
                    });

                // ALSO insert into main achievements table for unified display
                try {
                    const { error: mainAchError } = await this.supabase
                        .from('achievements')
                        .insert({
                            user_id: userId,
                            achievement_id: definition.dbId,
                            achievement_name: definition.title,
                            description: definition.description,
                            unlocked_at: new Date().toISOString(),
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        });

                    if (mainAchError) {
                        console.error('[AchievementManager] Failed to insert into main achievements table:', mainAchError);
                    } else {
                        console.log(`[AchievementManager] ✅ Achievement ${definition.title} added to main achievements table`);
                    }
                } catch (err) {
                    console.error('[AchievementManager] Error inserting into main achievements:', err);
                }

                // Award rewards by updating character_stats
                try {
                    const { data: stats } = await this.supabase
                        .from('character_stats')
                        .select('gold, experience')
                        .eq('user_id', userId)
                        .single();

                    if (stats) {
                        await this.supabase
                            .from('character_stats')
                            .update({
                                gold: (stats.gold || 0) + definition.reward.gold,
                                experience: (stats.experience || 0) + definition.reward.xp,
                                updated_at: new Date().toISOString()
                            })
                            .eq('user_id', userId);

                        console.log(`[AchievementManager] ✅ Awarded ${definition.reward.gold} gold and ${definition.reward.xp} XP for ${definition.title}`);
                    }
                } catch (rewardErr) {
                    console.error('[AchievementManager] Error awarding rewards:', rewardErr);
                }

                return true; // Unlocked successfully
            }
        }

        // Update progress even if not unlocked
        await this.supabase
            .from('alliance_achievements')
            .upsert({
                user_id: userId,
                achievement_type: type,
                progress: currentCount,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id, achievement_type' });

        return false;
    }

    async getAchievements(userId: string) {
        const { data } = await this.supabase
            .from('alliance_achievements')
            .select('*')
            .eq('user_id', userId);

        return data || [];
    }
}

