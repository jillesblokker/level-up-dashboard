import { Quest } from "@/types/game";
import { defaultQuests } from "@/lib/default-quests"; // Assuming default quests are here
// Replaced all Supabase direct calls with API routes for authentication flow
// All database logic now uses authenticated API routes

async function getClerkToken(): Promise<string | null> {
  if (typeof window === 'undefined') {
    console.error('[Quests Persistence] getClerkToken called on server side');
    return null;
  }

  try {
    // Access Clerk from window if available
    const clerk = (window as any).__clerk;
    if (!clerk) {
      console.error('[Quests Persistence] Clerk not available on window');
      return null;
    }

    const session = clerk.session;
    if (!session) {
      console.error('[Quests Persistence] No active Clerk session');
      return null;
    }

    const token = await session.getToken();
    console.log('[Quests Persistence] Got Clerk token:', token ? 'present' : 'null');
    return token;
  } catch (error) {
    console.error('[Quests Persistence] Error getting Clerk token:', error);
    return null;
  }
}

export async function fetchQuestsFromSupabase(): Promise<Quest[]> {
  try {
    const token = await getClerkToken();
    if (!token) {
      console.error('[Quests Persistence] No authentication token available, returning default quests');
      return defaultQuests;
    }

    const response = await fetch('/api/quests', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error('[Quests Persistence] Failed to fetch quests:', response.status, response.statusText, 'returning default');
      return defaultQuests;
    }

    const data = await response.json();
    console.log('[Quests Persistence] Successfully fetched quests from API');
    
    // Transform the data to match Quest type if needed
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
    console.error('[Quests Persistence] Error fetching quests from API, returning default:', error);
    return defaultQuests;
  }
}

export async function updateQuestCompletion(questId: string, completed: boolean): Promise<boolean> {
  try {
    const token = await getClerkToken();
    if (!token) {
      console.error('[Quests Persistence] No authentication token available');
      return false;
    }

    // First, ensure the quest completion record exists
    const postResponse = await fetch('/api/quests/completion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ questId }),
    });

    if (!postResponse.ok) {
      console.error('[Quests Persistence] Failed to create quest completion record:', postResponse.status, postResponse.statusText);
      return false;
    }

    // Then update the completion status
    const putResponse = await fetch('/api/quests/completion', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ questId, completed }),
    });

    if (!putResponse.ok) {
      console.error('[Quests Persistence] Failed to update quest completion:', putResponse.status, putResponse.statusText);
      return false;
    }

    console.log('[Quests Persistence] Successfully updated quest completion');
    return true;
  } catch (error) {
    console.error('[Quests Persistence] Error updating quest completion:', error);
    return false;
  }
}

export async function saveQuestProgress(questId: string, progress: number): Promise<boolean> {
  // For now, we'll just log this since there's no specific progress API
  // This could be implemented as a separate endpoint if needed
  console.log('[Quests Persistence] saveQuestProgress called for quest:', questId, 'progress:', progress);
  return true;
} 