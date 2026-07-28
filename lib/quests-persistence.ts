import { logger } from "@/lib/logger";
import { Quest } from "@/types/game";
import { defaultQuests } from "@/lib/default-quests";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

export async function fetchQuestsFromSupabase(): Promise<Quest[]> {
  try {
    const response = await fetchWithAuth('/api/quests');

    if (!response.ok) {
      logger.error('[Quests Persistence] Failed to fetch quests:', response.status, response.statusText, 'returning default');
      return defaultQuests;
    }

    const data = await response.json();
    logger.debug('[Quests Persistence] Successfully fetched quests from API');
    
    return (data || []).map((q: any) => ({
      id: q.id,
      title: q.title || q.name,
      description: q.description,
      category: q.category,
      difficulty: q.difficulty,
      rewards: q.rewards,
      completed: q.completed || false, 
      progress: q.progress || 0,
      userId: q.user_id || '',
      createdAt: q.created_at,
      updatedAt: q.updated_at || q.created_at,
    }));
  } catch (error) {
    logger.error('[Quests Persistence] Error fetching quests from API, returning default:', error);
    return defaultQuests;
  }
}

export async function updateQuestCompletion(questId: string, completed: boolean): Promise<boolean> {
  try {
    const response = await fetchWithAuth('/api/quests/smart-completion', {
      method: 'POST',
      body: JSON.stringify({ 
        questId, 
        completed,
        xpReward: 50,
        goldReward: 25
      }),
    });

    if (!response.ok) {
      logger.error('[Quests Persistence] Failed to process quest completion:', response.status, response.statusText);
      return false;
    }

    const result = await response.json();
    logger.debug('[Quests Persistence] Smart completion result:', result);
    return true;
  } catch (error) {
    logger.error('[Quests Persistence] Error processing quest completion:', error);
    return false;
  }
}

export async function saveQuestProgress(questId: string, progress: number): Promise<boolean> {
  // For now, we'll just log this since there's no specific progress API
  // This could be implemented as a separate endpoint if needed
  logger.debug('[Quests Persistence] saveQuestProgress called for quest:', questId, 'progress:', progress);
  return true;
} 