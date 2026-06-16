import { logger } from "@/lib/logger";
// Replaced all Supabase direct calls with API routes for authentication flow
// All database logic now uses authenticated API routes

export interface Achievement {
  id: string;
  user_id: string;
  name: string;
  description: string;
  category: string;
  points: number;
  unlocked: boolean;
  unlocked_at?: string;
}

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  points: number;
  icon?: string;
}

async function getClerkToken(): Promise<string | null> {
  if (typeof window === 'undefined') {
    logger.error('[Achievements Manager] getClerkToken called on server side');
    return null;
  }

  try {
    // Access Clerk from window if available (with standard fallbacks)
    const clerk = (window as any).__clerk || (window as any).Clerk || (window as any).clerk;
    if (!clerk) {
      logger.error('[Achievements Manager] Clerk not available on window');
      return null;
    }

    const session = clerk.session;
    if (!session) {
      logger.error('[Achievements Manager] No active Clerk session');
      return null;
    }

    const token = await session.getToken();
    logger.debug('[Achievements Manager] Got Clerk token:', token ? 'present' : 'null');
    return token;
  } catch (error) {
    logger.error('[Achievements Manager] Error getting Clerk token:', error);
    return null;
  }
}

export async function getUserAchievements(): Promise<Achievement[]> {
  try {
    const token = await getClerkToken();
    if (!token) {
      logger.error('[Achievements Manager] No authentication token available');
      return [];
    }

    const response = await fetch('/api/achievements', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      logger.error('[Achievements Manager] Failed to fetch achievements:', response.status, response.statusText);
      return [];
    }

    const data = await response.json();
    logger.debug('[Achievements Manager] Successfully fetched achievements from API');
    return data || [];
  } catch (error) {
    logger.error('[Achievements Manager] Error fetching achievements:', error);
    return [];
  }
}

export async function unlockAchievement(achievementId: string): Promise<boolean> {
  try {
    const token = await getClerkToken();
    if (!token) {
      logger.error('[Achievements Manager] No authentication token available');
      return false;
    }

    const response = await fetch('/api/achievements/unlock', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ achievementId }),
    });

    if (!response.ok) {
      logger.error('[Achievements Manager] Failed to unlock achievement:', response.status, response.statusText);
      return false;
    }

    logger.debug('[Achievements Manager] Successfully unlocked achievement:', achievementId);
    return true;
  } catch (error) {
    logger.error('[Achievements Manager] Error unlocking achievement:', error);
    return false;
  }
}

export async function checkAchievementProgress(category: string, metric: string, value: number): Promise<string[]> {
  // This function would check if any achievements should be unlocked based on progress
  // For now, we'll return an empty array since this requires more complex logic
  logger.debug('[Achievements Manager] checkAchievementProgress called:', { category, metric, value });
  return [];
}

export async function getAchievementDefinitions(): Promise<AchievementDefinition[]> {
  // This would typically fetch from a static definitions table or API
  // For now, return an empty array since this requires the achievement_definitions table
  logger.debug('[Achievements Manager] getAchievementDefinitions called');
  return [];
}

// Legacy exports for backward compatibility
export { getUserAchievements as getAchievementsFromSupabase };
export { unlockAchievement as unlockAchievementInSupabase }; 