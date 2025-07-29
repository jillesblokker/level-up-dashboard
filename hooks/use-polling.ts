// React hook for centralized polling service
// Provides easy integration with React components

import { useEffect, useRef } from 'react';
import { pollingService, createPollingConfig } from '@/lib/polling-service';

interface UsePollingOptions {
  enabled?: boolean;
  interval?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  debounceTime?: number;
}

export function usePolling(
  key: string,
  fetchFn: () => Promise<any>,
  options: UsePollingOptions = {}
) {
  const {
    enabled = true,
    interval = 15000,
    onSuccess,
    onError,
    debounceTime = 3000,
  } = options;

  const isInitialized = useRef(false);

  useEffect(() => {
    if (!enabled) {
      pollingService.stopPolling(key);
      return;
    }

    console.log(`[usePolling] Setting up polling for ${key}`);
    
    const config = createPollingConfig(
      interval,
      enabled,
      onSuccess,
      onError
    );

    pollingService.startPolling(key, fetchFn, config);
    isInitialized.current = true;

    return () => {
      console.log(`[usePolling] Cleaning up polling for ${key}`);
      pollingService.stopPolling(key);
      isInitialized.current = false;
    };
  }, [key, enabled, interval, onSuccess, onError]);

  // Return utility functions
  return {
    // Set last edit time for debouncing
    setLastEditTime: () => pollingService.setLastEditTime(key),
    
    // Check if polling is active
    isActive: () => pollingService.getActiveKeys().includes(key),
    
    // Stop polling manually
    stop: () => pollingService.stopPolling(key),
    
    // Start polling manually
    start: () => {
      const config = createPollingConfig(interval, true, onSuccess, onError);
      pollingService.startPolling(key, fetchFn, config);
    },
  };
}

// Specialized hook for milestones polling
export function useMilestonesPolling(token: string | null) {
  const fetchMilestones = async () => {
    if (!token) throw new Error('No token provided');
    
    const response = await fetch('/api/milestones', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  };

  return usePolling('milestones', fetchMilestones, {
    enabled: !!token,
    interval: 15000,
    onSuccess: (data) => console.log('[useMilestonesPolling] Received', data.length, 'milestones'),
    onError: (error) => console.error('[useMilestonesPolling] Error:', error),
  });
}

// Specialized hook for challenges polling
export function useChallengesPolling(token: string | null) {
  const fetchChallenges = async () => {
    if (!token) throw new Error('No token provided');
    
    const response = await fetch('/api/challenges', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  };

  return usePolling('challenges', fetchChallenges, {
    enabled: !!token,
    interval: 15000,
    onSuccess: (data) => console.log('[useChallengesPolling] Received', data.length, 'challenges'),
    onError: (error) => console.error('[useChallengesPolling] Error:', error),
  });
}

// Specialized hook for streaks polling
export function useStreaksPolling(token: string | null, category: string) {
  const fetchStreaks = async () => {
    if (!token) throw new Error('No token provided');
    
    const response = await fetch(`/api/streaks-direct?category=${encodeURIComponent(category)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  };

  return usePolling(`streaks-${category}`, fetchStreaks, {
    enabled: !!token && !!category,
    interval: 15000,
    onSuccess: (data) => console.log('[useStreaksPolling] Received streak data:', data),
    onError: (error) => console.error('[useStreaksPolling] Error:', error),
  });
} 