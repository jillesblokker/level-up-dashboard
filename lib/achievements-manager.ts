import { supabase } from '@/lib/supabase/client';

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  progress?: number;
}

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon?: string;
  category?: string;
  goal?: number;
}

// Get all achievements unlocked by the user
export async function getUserAchievements(userId: string): Promise<UserAchievement[]> {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .eq('user_id', userId);
  if (error) {
    console.error('Error fetching user achievements:', error);
    return [];
  }
  return data as UserAchievement[];
}

// Unlock an achievement for the user
export async function unlockAchievement(userId: string, achievementId: string) {
  if (!userId || !achievementId) return;
  await supabase
    .from('achievements')
    .insert({
      user_id: userId,
      achievement_id: achievementId,
      unlocked_at: new Date().toISOString(),
    });
  window.dispatchEvent(new Event('achievements-update'));
}

// Update achievement progress for the user
export async function updateAchievementProgress(userId: string, achievementId: string, progress: number) {
  if (!userId || !achievementId) return;
  await supabase
    .from('achievements')
    .update({ progress })
    .eq('user_id', userId)
    .eq('achievement_id', achievementId);
  window.dispatchEvent(new Event('achievements-update'));
}

// Get all achievement definitions (public, not user-specific)
export async function getAchievementDefinitions(): Promise<AchievementDefinition[]> {
  const { data, error } = await supabase
    .from('achievement_definitions')
    .select('*');
  if (error) {
    console.error('Error fetching achievement definitions:', error);
    return [];
  }
  return data as AchievementDefinition[];
} 