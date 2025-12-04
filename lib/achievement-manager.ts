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
    title: string;
    description: string;
    icon: string;
    requirement: number;
    reward: {
        xp: number;
        gold: number;
        title?: string;
    };
}

export const ACHIEVEMENTS: Record<AchievementType, AchievementDefinition> = {
    first_friend: {
        id: 'first_friend',
        title: 'New Alliance',
        description: 'Add your first friend',
        icon: 'UserPlus',
        requirement: 1,
        reward: { xp: 50, gold: 10 }
    },
    five_friends: {
        id: 'five_friends',
        title: 'Popular Companion',
        description: 'Add 5 friends',
        icon: 'Users',
        requirement: 5,
        reward: { xp: 200, gold: 50, title: 'Companion' }
    },
    ten_friends: {
        id: 'ten_friends',
        title: 'Guild Leader',
        description: 'Add 10 friends',
        icon: 'Crown',
        requirement: 10,
        reward: { xp: 500, gold: 100, title: 'Leader' }
    },
    first_quest_sent: {
        id: 'first_quest_sent',
        title: 'Quest Giver',
        description: 'Send your first quest to a friend',
        icon: 'Scroll',
        requirement: 1,
        reward: { xp: 50, gold: 10 }
    },
    five_quests_sent: {
        id: 'five_quests_sent',
        title: 'Task Master',
        description: 'Send 5 quests to friends',
        icon: 'ScrollText',
        requirement: 5,
        reward: { xp: 200, gold: 50 }
    },
    ten_quests_sent: {
        id: 'ten_quests_sent',
        title: 'Grand Questmaster',
        description: 'Send 10 quests to friends',
        icon: 'BookOpen',
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
            // Check if already unlocked
            const { data: existing } = await this.supabase
                .from('alliance_achievements')
                .select('*')
                .eq('user_id', userId)
                .eq('achievement_type', type)
                .single();

            if (!existing) {
                // Unlock!
                await this.supabase
                    .from('alliance_achievements')
                    .insert({
                        user_id: userId,
                        achievement_type: type,
                        progress: currentCount,
                        unlocked_at: new Date().toISOString()
                    });

                // Award rewards (XP/Gold)
                // Note: This assumes a function to add rewards exists or we do it manually
                // For now, we'll just return true and let the caller handle notifications
                // In a real app, we'd call a stored procedure to add stats safely

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
