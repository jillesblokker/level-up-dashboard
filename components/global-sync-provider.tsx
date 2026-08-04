"use client";

import React, { useEffect } from 'react';
import { useAuthContext } from '@/components/providers';
import { characterStatsService } from '@/lib/character-stats-service';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';

export function GlobalSyncProvider({ children }: { children: React.ReactNode }) {
  const { userId } = useAuthContext();

  const checkBuildVersionAndInvalidateCache = async () => {
    if (typeof window === 'undefined') return;
    try {
      const res = await fetch('/api/version', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const serverVersion = data.version;
        const localVersion = localStorage.getItem('__app_build_version');

        if (serverVersion && localVersion && localVersion !== serverVersion) {
          // New build version detected! Purge ServiceWorker caches once
          localStorage.setItem('__app_build_version', serverVersion);
          if ('caches' in window) {
            const cacheKeys = await caches.keys();
            await Promise.all(cacheKeys.map(key => caches.delete(key)));
          }
          if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (const reg of registrations) {
              await reg.unregister();
            }
          }
          // Perform clean reload to execute latest code
          window.location.reload();
          return;
        }

        if (serverVersion) {
          localStorage.setItem('__app_build_version', serverVersion);
        }
      }
    } catch {}
  };

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
    checkBuildVersionAndInvalidateCache();
    if (userId) {
      handleSync();
    }
  }, [userId]);

  return <>{children}</>;
}
