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

      // 2. Auto-hydrate inventory if local inventory is empty
      const { fetchWithAuth } = await import('@/lib/fetchWithAuth');
      const { unwrapApiResponse } = await import('@/lib/api-response-unwrapper');
      const { getUserScopedItem, setUserScopedItem } = await import('@/lib/user-scoped-storage');

      const localInv = getUserScopedItem('inventory');
      if (!localInv || localInv === '[]') {
        const resInv = await fetchWithAuth('/api/inventory');
        if (resInv.ok) {
          const raw = await resInv.json();
          const invData = unwrapApiResponse<any>(raw);
          const items = Array.isArray(invData) ? invData : (invData?.data || []);
          if (items.length > 0) {
            setUserScopedItem('inventory', JSON.stringify(items));
          }
        }
      }

      // 3. Auto-hydrate checked quests for today
      const localQuests = getUserScopedItem('quests-cache');
      if (!localQuests || localQuests === '[]') {
        const resQuests = await fetchWithAuth(`/api/quests?t=${Date.now()}`);
        if (resQuests.ok) {
          const raw = await resQuests.json();
          const questData = unwrapApiResponse<any>(raw);
          const questArray = Array.isArray(questData) ? questData : (questData?.quests || []);
          if (questArray.length > 0) {
            const todayStr = new Intl.DateTimeFormat('en-CA').format(new Date());
            setUserScopedItem('quests-cache', JSON.stringify(questArray));
            setUserScopedItem('quests-cache-date', todayStr);
          }
        }
      }

      // 4. Auto-hydrate Daily Fate tarot card
      const localFate = getUserScopedItem('daily_fate') || localStorage.getItem('daily_fate');
      if (!localFate) {
        const resFate = await fetchWithAuth('/api/user-preferences?key=daily_fate');
        if (resFate.ok) {
          const raw = await resFate.json();
          const fateData = unwrapApiResponse<any>(raw);
          const val = fateData?.value || fateData?.preference_value || fateData;
          if (val) {
            setUserScopedItem('daily_fate', JSON.stringify(val));
            localStorage.setItem('daily_fate', JSON.stringify(val));
          }
        }
      }

      // 5. Dispatch cross-component / cross-page sync event for active views
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('global-sync-tick'));
        window.dispatchEvent(new Event('character-stats-update'));
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
