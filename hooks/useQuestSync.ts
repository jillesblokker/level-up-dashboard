import { useCallback } from 'react';
import { useRealtimeSync } from './useRealtimeSync';
import { useQuestToasts } from '@/components/enhanced-toast-system';

interface QuestSyncCallbacks {
  onQuestsUpdate?: () => Promise<void>;
  onCharacterStatsUpdate?: () => Promise<void>;
  onError?: (error: Error) => void;
}

export function useQuestSync(callbacks: QuestSyncCallbacks) {
  const questToasts = useQuestToasts();
  
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
  }, [callbacks]);

  const { syncNow, isSyncing, lastSync } = useRealtimeSync(
    {
      onSync: syncQuests,
      onError: callbacks.onError || (() => {}),
    },
    {
      enabled: true,
      intervalMs: 30000, // 30 seconds
      onVisibilityChange: true,
      onFocus: true,
    }
  );

  return {
    syncNow,
    isSyncing,
    lastSync,
  };
}
