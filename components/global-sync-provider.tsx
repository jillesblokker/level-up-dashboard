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

      // 3. Reconcile & Auto-Push Locally Completed Quests to Supabase Server DB
      const resQuests = await fetchWithAuth(`/api/quests?t=${Date.now()}`);
      const todayStr = new Intl.DateTimeFormat('en-CA').format(new Date());

      if (resQuests.ok) {
        const raw = await resQuests.json();
        const questData = unwrapApiResponse<any>(raw);
        const serverArray: any[] = Array.isArray(questData) ? questData : (questData?.quests || []);
        
        const localQuestsStr = getUserScopedItem('quests-cache');
        const cacheDate = getUserScopedItem('quests-cache-date');

        if (localQuestsStr && cacheDate === todayStr) {
          try {
            const localArray: any[] = JSON.parse(localQuestsStr);
            if (Array.isArray(localArray)) {
              // Index server completions by ID, Name, Title
              const serverMap = new Map<string, any>();
              serverArray.forEach(sq => {
                if (sq.id) serverMap.set(String(sq.id).toLowerCase(), sq);
                if (sq.name) serverMap.set(String(sq.name).toLowerCase(), sq);
                if (sq.title) serverMap.set(String(sq.title).toLowerCase(), sq);
              });

              for (const lq of localArray) {
                if (lq.completed) {
                  const qId = String(lq.id || '').toLowerCase();
                  const qName = String(lq.name || '').toLowerCase();
                  const serverMatch = serverMap.get(qId) || serverMap.get(qName);

                  if (!serverMatch || !serverMatch.completed) {
                    // Local is ahead for this quest -> push completion to Supabase
                    fetchWithAuth('/api/quests/smart-completion', {
                      method: 'POST',
                      body: JSON.stringify({
                        questId: lq.id,
                        completed: true,
                        xpReward: lq.xp || 50,
                        goldReward: lq.gold || 25
                      })
                    }).catch(() => {});
                  }
                }
              }
            }
          } catch {}
        } else if ((!localQuestsStr || localQuestsStr === '[]') && serverArray.length > 0) {
          // Local cache empty -> hydrate from server
          setUserScopedItem('quests-cache', JSON.stringify(serverArray));
          setUserScopedItem('quests-cache-date', todayStr);
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
