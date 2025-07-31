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

    const config = createPollingConfig(
      interval,
      enabled,
      onSuccess,
      onError
    );

    pollingService.startPolling(key, fetchFn, config);
    isInitialized.current = true;

    return () => {
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
    
    console.log('[Milestones Poll] Token length:', token.length);
    console.log('[Milestones Poll] Token starts with:', token.substring(0, 20) + '...');
    
    const response = await fetch('/api/milestones', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('[Milestones Poll] Response status:', response.status);
    console.log('[Milestones Poll] Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.log('[Milestones Poll] Error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  };

  return usePolling('milestones', fetchMilestones, {
    enabled: !!token,
    interval: 15000,
    onSuccess: (data) => {
      console.log('[Milestones Poll] Success:', data);
    },
    onError: (error) => {
      console.error('[Milestones Poll] Error:', error);
    },
  });
}

// Specialized hook for challenges polling
export function useChallengesPolling(token: string | null) {
  const fetchChallenges = async () => {
    if (!token) throw new Error('No token provided');
    
    console.log('[Challenges Poll] Token length:', token.length);
    console.log('[Challenges Poll] Token starts with:', token.substring(0, 20) + '...');
    
    const response = await fetch('/api/challenges', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('[Challenges Poll] Response status:', response.status);
    console.log('[Challenges Poll] Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.log('[Challenges Poll] Error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  };

  return usePolling('challenges', fetchChallenges, {
    enabled: !!token,
    interval: 15000,
    onSuccess: (data) => {
      console.log('[Challenges Poll] Success:', data);
    },
    onError: (error) => {
      console.error('[Challenges Poll] Error:', error);
    },
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
    onSuccess: (data) => {},
    onError: (error) => {},
  });
} 