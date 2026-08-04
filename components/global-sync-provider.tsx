"use client";

import React, { useEffect } from 'react';
import { useAuthContext } from '@/components/providers';
import { characterStatsService } from '@/lib/character-stats-service';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';

export function GlobalSyncProvider({ children }: { children: React.ReactNode }) {
  const { userId } = useAuthContext();

  const handleSync = async () => {
    if (!userId) return;
    try {
      // 1. Re-fetch and merge character stats (level, gold, exp) from Supabase
      await characterStatsService.fetchAndMerge();

      // 2. Dispatch cross-component / cross-page sync event for active views
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('global-sync-tick'));
      }
    } catch {
      // Silent error logging to avoid UI disruption
    }
  };

  // Setup periodic background revalidation (45 seconds) & tab focus revalidation
  useRealtimeSync(
    { onSync: handleSync },
    { enabled: !!userId, intervalMs: 45000, onVisibilityChange: true, onFocus: true }
  );

  // Initial sync on mount when user is authenticated
  useEffect(() => {
    if (userId) {
      handleSync();
    }
  }, [userId]);

  return <>{children}</>;
}
