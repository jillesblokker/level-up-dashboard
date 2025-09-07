import { useEffect, useRef, useCallback } from 'react';

interface RealtimeSyncOptions {
  enabled?: boolean;
  intervalMs?: number;
  onVisibilityChange?: boolean;
  onFocus?: boolean;
}

interface RealtimeSyncCallbacks {
  onSync?: () => Promise<void>;
  onError?: (error: Error) => void;
}

export function useRealtimeSync(
  callbacks: RealtimeSyncCallbacks,
  options: RealtimeSyncOptions = {}
) {
  const {
    enabled = true,
    intervalMs = 30000, // 30 seconds
    onVisibilityChange = true,
    onFocus = true,
  } = options;

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isSyncingRef = useRef(false);
  const lastSyncRef = useRef<number>(0);

  const performSync = useCallback(async () => {
    if (isSyncingRef.current || !callbacks.onSync) return;
    
    isSyncingRef.current = true;
    try {
      await callbacks.onSync();
      lastSyncRef.current = Date.now();
    } catch (error) {
      console.error('[Realtime Sync] Sync failed:', error);
      callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
    } finally {
      isSyncingRef.current = false;
    }
  }, [callbacks]);

  const startPolling = useCallback(() => {
    if (intervalRef.current) return; // Already polling
    
    intervalRef.current = setInterval(() => {
      // Only sync if page is visible
      if (document.visibilityState === 'visible') {
        performSync();
      }
    }, intervalMs);
  }, [intervalMs, performSync]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Handle visibility changes
  useEffect(() => {
    if (!onVisibilityChange) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Page became visible, sync if it's been a while
        const timeSinceLastSync = Date.now() - lastSyncRef.current;
        if (timeSinceLastSync > intervalMs) {
          performSync();
        }
        startPolling();
      } else {
        // Page became hidden, stop polling to save resources
        stopPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [onVisibilityChange, intervalMs, performSync, startPolling, stopPolling]);

  // Handle window focus
  useEffect(() => {
    if (!onFocus) return;

    const handleFocus = () => {
      // Window focused, sync if it's been a while
      const timeSinceLastSync = Date.now() - lastSyncRef.current;
      if (timeSinceLastSync > intervalMs) {
        performSync();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [onFocus, intervalMs, performSync]);

  // Start/stop polling based on enabled state
  useEffect(() => {
    if (enabled && document.visibilityState === 'visible') {
      startPolling();
    } else {
      stopPolling();
    }

    return stopPolling;
  }, [enabled, startPolling, stopPolling]);

  // Manual sync function
  const syncNow = useCallback(() => {
    performSync();
  }, [performSync]);

  return {
    syncNow,
    isSyncing: isSyncingRef.current,
    lastSync: lastSyncRef.current,
  };
}
