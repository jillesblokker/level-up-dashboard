import { useCallback, useEffect, useRef } from 'react';
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

  const callbacksRef = useRef(callbacks);
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);
  
  const syncQuests = useCallback(async () => {
    try {
      // Sync quests first
      if (callbacksRef.current.onQuestsUpdate) {
        await callbacksRef.current.onQuestsUpdate();
      }
      
      // Then sync character stats
      if (callbacksRef.current.onCharacterStatsUpdate) {
        await callbacksRef.current.onCharacterStatsUpdate();
      }
    } catch (error) {
      console.error('[Quest Sync] Sync failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      questToasts.showSyncError(errorMessage);
      throw error;
    }
  }, [questToasts]);

  // Subscribe to master Supabase Realtime WebSocket manager with debouncing to prevent API floods
  useEffect(() => {
    if (user?.id) {
      realtimeSyncManager.initialize(user.id);
    }

    let debounceTimer: NodeJS.Timeout | null = null;

    const unsubscribe = realtimeSyncManager.subscribe((event) => {
      if (['quest_completion', 'user_quests', 'character_stats', 'streaks', 'challenges'].includes(event.table)) {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          console.log(`[Quest Sync] Realtime event on table '${event.table}' — triggering debounced refetch...`);
          syncQuests().catch(() => {});
        }, 1500); // 1.5s debounce buffer
      }
    });

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      unsubscribe();
    };
  }, [user?.id, syncQuests]);

  const { syncNow, isSyncing, lastSync } = useRealtimeSync(
    {
      onSync: syncQuests,
      onError: (err) => callbacksRef.current.onError?.(err),
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
