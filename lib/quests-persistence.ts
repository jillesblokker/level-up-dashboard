import { logger } from "@/lib/logger";
import { Quest } from "@/types/game";
import { defaultQuests } from "@/lib/default-quests";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

export async function fetchQuestsFromSupabase(): Promise<Quest[]> {
  const getCachedQuests = (): Quest[] | null => {
    if (typeof window === 'undefined') return null;
    try {
      const cached = localStorage.getItem('quests-cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return null;
  };

  try {
    const response = await fetchWithAuth('/api/quests');

    if (!response.ok) {
      logger.error('[Quests Persistence] Failed to fetch quests:', response.status, response.statusText, 'retaining local cache');
      return getCachedQuests() || defaultQuests;
    }

    const data = await response.json();
    if (!data || !Array.isArray(data)) {
      return getCachedQuests() || defaultQuests;
    }

    logger.debug('[Quests Persistence] Successfully fetched quests from API');
    
    const mapped = data.map((q: any) => ({
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

    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('quests-cache', JSON.stringify(mapped));
      }
    } catch {}

    return mapped;
  } catch (error) {
    logger.error('[Quests Persistence] Error fetching quests from API, retaining local cache:', error);
    return getCachedQuests() || defaultQuests;
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

/**
 * Reconciles server quest response with local cached quest state.
 * Performs bi-directional lookup by ID, Name, Title (and case-insensitive matches)
 * to ensure checked quests are never accidentally unchecked or duplicated.
 */
export function reconcileQuestList(serverQuests: any[], localQuests: any[] = [], isSameDay: boolean = true): any[] {
  const serverList = Array.isArray(serverQuests) ? serverQuests : [];
  const localList = Array.isArray(localQuests) ? localQuests : [];

  if (serverList.length === 0 && localList.length > 0) {
    return localList;
  }

  // Index local quests by ID, Name, and Title
  const localMap = new Map<string, any>();
  localList.forEach((lq: any) => {
    if (lq.id) localMap.set(String(lq.id).toLowerCase(), lq);
    if (lq.name) localMap.set(String(lq.name).toLowerCase().trim(), lq);
    if (lq.title) localMap.set(String(lq.title).toLowerCase().trim(), lq);
  });

  return serverList.map((sq: any) => {
    const sqId = String(sq.id || '').toLowerCase();
    const sqName = String(sq.name || sq.title || '').toLowerCase().trim();

    const localMatch = localMap.get(sqId) || (sqName ? localMap.get(sqName) : undefined);
    // For today, preserve local optimistic completion (so network/502 errors never wipe player tracking)
    // Server completion (sq.completed = true) or local completion (localMatch.completed = true) both count as completed for today.
    const isCompleted = isSameDay
      ? Boolean(sq.completed || localMatch?.completed)
      : Boolean(sq.completed);

    return {
      ...(localMatch || {}),
      ...sq,
      id: localMatch?.id || sq.id,
      completed: isCompleted,
      date: isCompleted ? (sq.date || localMatch?.date || new Date().toISOString()) : null
    };
  });
} 