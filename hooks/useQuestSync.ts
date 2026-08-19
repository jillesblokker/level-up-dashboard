import { useCallback, useEffect } from 'react';
import { useRealtimeSync } from './useRealtimeSync';
import { useQuestToasts } from '@/components/enhanced-toast-system';
import { realtimeSyncManager } from '@/lib/realtime-sync-manager';
import { useUser } from '@clerk/nextjs';

interface QuestSyncCallbacks {
  onQuestsUpdate?: () => Promise<void>;
  onCharacterStatsUpdate?: () => Promise<void>;
  onError?: (error: Error) => void;
}

export function useQuestSync(callbacks: QuestSyncCallbacks) {
  const questToasts = useQuestToasts();
  const { user } = useUser();
  
  const syncQuests = useCallback(async () => {
    try {
      // Sync quests first
      if (callbacks.onQuestsUpdate) {
        await callbacks.onQuestsUpdate();
      }
      
      // Then sync character stats
      if (callbacks.onCharacterStatsUpdate) {
        await callbacks.onCharacterStatsUpdate();
      }
    } catch (error) {
      console.error('[Quest Sync] Sync failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      questToasts.showSyncError(errorMessage);
      throw error;
    }
  }, [callbacks, questToasts]);

  // Subscribe to master Supabase Realtime WebSocket manager
  useEffect(() => {
    if (user?.id) {
      realtimeSyncManager.initialize(user.id);
    }

    const unsubscribe = realtimeSyncManager.subscribe((event) => {
      if (['quest_completion', 'user_quests', 'character_stats', 'streaks', 'challenges'].includes(event.table)) {
        console.log(`[Quest Sync] Realtime event on table '${event.table}' — triggering refetch...`);
        syncQuests();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [user?.id, syncQuests]);

  const { syncNow, isSyncing, lastSync } = useRealtimeSync(
    {
      onSync: syncQuests,
      onError: callbacks.onError || (() => {}),
    },
    {
      enabled: true,
      intervalMs: 15000, // fallback safety poll every 15s when visible
      onVisibilityChange: true, // re-fetch when tab becomes visible
      onFocus: true, // re-fetch when window regains focus
    }
  );

  return {
    syncNow,
    isSyncing,
    lastSync,
  };
}
