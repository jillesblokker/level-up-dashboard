import { useState, useEffect, useCallback } from 'react';

interface OfflineQueueItem {
  id: string;
  type: 'quest-completion';
  data: {
    questId: string;
    completed: boolean;
    xp?: number;
    gold?: number;
    category?: string;
  };
  timestamp: number;
  retryCount: number;
}

interface OfflineSupportOptions {
  maxRetries?: number;
  retryDelayMs?: number;
  queueKey?: string;
}

export function useOfflineSupport(options: OfflineSupportOptions = {}) {
  const {
    maxRetries = 3,
    retryDelayMs = 5000,
    queueKey = 'offline-quest-queue',
  } = options;

  const [isOnline, setIsOnline] = useState(true);
  const [queue, setQueue] = useState<OfflineQueueItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load queue from localStorage on mount
  useEffect(() => {
    try {
      const savedQueue = localStorage.getItem(queueKey);
      if (savedQueue) {
        const parsedQueue = JSON.parse(savedQueue);
        setQueue(parsedQueue);
      }
    } catch (error) {
      console.error('[Offline Support] Failed to load queue:', error);
    }
  }, [queueKey]);

  // Save queue to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(queueKey, JSON.stringify(queue));
    } catch (error) {
      console.error('[Offline Support] Failed to save queue:', error);
    }
  }, [queue, queueKey]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('[Offline Support] Back online, processing queue...');
      processQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('[Offline Support] Gone offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial status
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Add item to offline queue
  const addToQueue = useCallback((item: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'retryCount'>) => {
    const queueItem: OfflineQueueItem = {
      ...item,
      id: `${item.type}-${item.data.questId}-${Date.now()}`,
      timestamp: Date.now(),
      retryCount: 0,
    };

    setQueue(prev => [...prev, queueItem]);
    console.log('[Offline Support] Added to queue:', queueItem);
  }, []);

  // Process the offline queue
  const processQueue = useCallback(async () => {
    if (isProcessing || !isOnline || queue.length === 0) return;

    setIsProcessing(true);
    console.log('[Offline Support] Processing queue:', queue.length, 'items');

    const itemsToProcess = [...queue];
    const successfulItems: string[] = [];
    const failedItems: OfflineQueueItem[] = [];

    for (const item of itemsToProcess) {
      try {
        await processQueueItem(item);
        successfulItems.push(item.id);
      } catch (error) {
        console.error('[Offline Support] Failed to process item:', item, error);
        
        if (item.retryCount < maxRetries) {
          // Increment retry count and keep in queue
          failedItems.push({
            ...item,
            retryCount: item.retryCount + 1,
          });
        } else {
          // Max retries reached, remove from queue
          console.error('[Offline Support] Max retries reached for item:', item.id);
        }
      }
    }

    // Update queue by removing successful items and updating failed ones
    setQueue(prev => {
      const remainingItems = prev.filter(item => !successfulItems.includes(item.id));
      return [...remainingItems, ...failedItems];
    });

    setIsProcessing(false);
  }, [isProcessing, isOnline, queue, maxRetries]);

  // Process individual queue item
  const processQueueItem = async (item: OfflineQueueItem) => {
    switch (item.type) {
      case 'quest-completion':
        const response = await fetch('/api/quests/smart-completion', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            questId: item.data.questId,
            completed: item.data.completed,
            xpReward: item.data.xp || 50,
            goldReward: item.data.gold || 25,
          }),
        });

        if (!response.ok) {
          throw new Error(`Quest completion failed: ${response.status}`);
        }

        console.log('[Offline Support] Successfully processed quest completion:', item.data.questId);
        break;

      default:
        throw new Error(`Unknown queue item type: ${item.type}`);
    }
  };

  // Clear the queue
  const clearQueue = useCallback(() => {
    setQueue([]);
    localStorage.removeItem(queueKey);
  }, [queueKey]);

  // Get queue statistics
  const getQueueStats = useCallback(() => {
    return {
      total: queue.length,
      pending: queue.filter(item => item.retryCount === 0).length,
      retrying: queue.filter(item => item.retryCount > 0).length,
      oldestItem: queue.length > 0 ? Math.min(...queue.map(item => item.timestamp)) : null,
    };
  }, [queue]);

  return {
    isOnline,
    queue,
    isProcessing,
    addToQueue,
    processQueue,
    clearQueue,
    getQueueStats,
  };
}
