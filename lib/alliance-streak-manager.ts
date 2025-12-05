import { SupabaseClient } from '@supabase/supabase-js';

export class AllianceStreakManager {
    private supabase: SupabaseClient;

    constructor(supabase: SupabaseClient) {
        this.supabase = supabase;
    }

    /**
     * Update alliance streak for a user
     * Called when user interacts with allies (sends quest, compares stats, etc.)
     */
    async updateStreak(userId: string): Promise<{ streak: number; isNewRecord: boolean }> {
        try {
            // Get current streak data
            const { data: stats, error: fetchError } = await this.supabase
                .from('character_stats')
                .select('alliance_streak, alliance_streak_last_updated, alliance_streak_longest')
                .eq('user_id', userId)
                .single();

            if (fetchError) {
                console.error('Error fetching streak data:', fetchError);
                return { streak: 0, isNewRecord: false };
            }

            const now = new Date();
            const lastUpdated = stats.alliance_streak_last_updated
                ? new Date(stats.alliance_streak_last_updated)
                : null;

            let newStreak = stats.alliance_streak || 0;
            let isNewRecord = false;

            // Check if this is a new day
            if (lastUpdated) {
                const hoursSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);

                if (hoursSinceUpdate < 24) {
                    // Same day, no change
                    return { streak: newStreak, isNewRecord: false };
                } else if (hoursSinceUpdate < 48) {
                    // Next day, increment streak
                    newStreak += 1;
                } else {
                    // Missed a day, reset streak
                    newStreak = 1;
                }
            } else {
                // First time
                newStreak = 1;
            }

            // Check if new record
            const longestStreak = stats.alliance_streak_longest || 0;
            if (newStreak > longestStreak) {
                isNewRecord = true;
            }

            // Update database
            const { error: updateError } = await this.supabase
                .from('character_stats')
                .update({
                    alliance_streak: newStreak,
                    alliance_streak_last_updated: now.toISOString(),
                    alliance_streak_longest: Math.max(newStreak, longestStreak)
                })
                .eq('user_id', userId);

            if (updateError) {
                console.error('Error updating streak:', updateError);
                return { streak: newStreak, isNewRecord };
            }

            // Award streak rewards
            await this.awardStreakRewards(userId, newStreak, isNewRecord);

            return { streak: newStreak, isNewRecord };
        } catch (error) {
            console.error('Error in updateStreak:', error);
            return { streak: 0, isNewRecord: false };
        }
    }

    /**
     * Award rewards for streak milestones
     */
    private async awardStreakRewards(userId: string, streak: number, isNewRecord: boolean) {
        const rewards: { xp: number; gold: number; title?: string } = { xp: 0, gold: 0 };

        // Daily streak bonus
        rewards.xp = streak * 5; // 5 XP per day
        rewards.gold = Math.floor(streak / 7) * 10; // 10 gold per week

        // Milestone rewards
        if (streak === 7) {
            rewards.xp += 50;
            rewards.gold += 25;
            rewards.title = 'Loyal Ally';
        } else if (streak === 30) {
            rewards.xp += 200;
            rewards.gold += 100;
            rewards.title = 'Steadfast Companion';
        } else if (streak === 100) {
            rewards.xp += 500;
            rewards.gold += 250;
            rewards.title = 'Eternal Friend';
        }

        // Apply rewards
        if (rewards.xp > 0 || rewards.gold > 0) {
            const { data: currentStats } = await this.supabase
                .from('character_stats')
                .select('experience, gold, title')
                .eq('user_id', userId)
                .single();

            if (currentStats) {
                const updates: any = {
                    experience: (currentStats.experience || 0) + rewards.xp,
                    gold: (currentStats.gold || 0) + rewards.gold
                };

                if (rewards.title) {
                    updates.title = rewards.title;
                }

                await this.supabase
                    .from('character_stats')
                    .update(updates)
                    .eq('user_id', userId);
            }
        }

        // Send notification for milestones
        if (streak === 7 || streak === 30 || streak === 100 || isNewRecord) {
            await this.supabase
                .from('notifications')
                .insert({
                    user_id: userId,
                    type: 'alliance_streak_milestone',
                    data: {
                        streak,
                        isNewRecord,
                        rewards
                    }
                });
        }
    }

    /**
     * Get current streak for a user
     */
    async getStreak(userId: string): Promise<{ current: number; longest: number; lastUpdated: string | null }> {
        try {
            const { data, error } = await this.supabase
                .from('character_stats')
                .select('alliance_streak, alliance_streak_longest, alliance_streak_last_updated')
                .eq('user_id', userId)
                .single();

            if (error || !data) {
                return { current: 0, longest: 0, lastUpdated: null };
            }

            return {
                current: data.alliance_streak || 0,
                longest: data.alliance_streak_longest || 0,
                lastUpdated: data.alliance_streak_last_updated
            };
        } catch (error) {
            console.error('Error getting streak:', error);
            return { current: 0, longest: 0, lastUpdated: null };
        }
    }
}
