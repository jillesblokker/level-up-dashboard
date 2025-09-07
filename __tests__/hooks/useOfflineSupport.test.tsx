import { renderHook, act, waitFor } from '@testing-library/react';
import { useOfflineSupport } from '@/hooks/useOfflineSupport';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

// Mock fetch
global.fetch = jest.fn();

describe('useOfflineSupport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    navigator.onLine = true;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useOfflineSupport());

    expect(result.current.isOnline).toBe(true);
    expect(result.current.queue).toEqual([]);
    expect(result.current.isProcessing).toBe(false);
  });

  it('should load queue from localStorage on mount', () => {
    const savedQueue = [
      {
        id: 'test-1',
        type: 'quest-completion',
        data: { questId: 'quest-1', completed: true },
        timestamp: Date.now(),
        retryCount: 0,
      },
    ];
    localStorageMock.getItem.mockReturnValue(JSON.stringify(savedQueue));

    const { result } = renderHook(() => useOfflineSupport());

    expect(result.current.queue).toEqual(savedQueue);
    expect(localStorageMock.getItem).toHaveBeenCalledWith('offline-quest-queue');
  });

  it('should save queue to localStorage when queue changes', () => {
    const { result } = renderHook(() => useOfflineSupport());

    act(() => {
      result.current.addToQueue({
        type: 'quest-completion',
        data: { questId: 'quest-1', completed: true },
      });
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'offline-quest-queue',
      expect.stringContaining('quest-1')
    );
  });

  it('should add item to queue with correct structure', () => {
    const { result } = renderHook(() => useOfflineSupport());

    act(() => {
      result.current.addToQueue({
        type: 'quest-completion',
        data: {
          questId: 'quest-1',
          completed: true,
          xp: 50,
          gold: 25,
          category: 'might',
        },
      });
    });

    const queue = result.current.queue;
    expect(queue).toHaveLength(1);
    expect(queue[0]).toMatchObject({
      type: 'quest-completion',
      data: {
        questId: 'quest-1',
        completed: true,
        xp: 50,
        gold: 25,
        category: 'might',
      },
      retryCount: 0,
    });
    expect(queue[0].id).toContain('quest-completion-quest-1');
    expect(queue[0].timestamp).toBeCloseTo(Date.now(), -2);
  });

  it('should process queue successfully when online', async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({ success: true }),
    };
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useOfflineSupport());

    // Add item to queue
    act(() => {
      result.current.addToQueue({
        type: 'quest-completion',
        data: { questId: 'quest-1', completed: true },
      });
    });

    expect(result.current.queue).toHaveLength(1);

    // Process queue
    await act(async () => {
      await result.current.processQueue();
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/quests/smart-completion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        questId: 'quest-1',
        completed: true,
        xpReward: 50,
        goldReward: 25,
      }),
    });

    // Queue should be empty after successful processing
    expect(result.current.queue).toHaveLength(0);
  });

  it('should retry failed items up to max retries', async () => {
    const mockResponse = {
      ok: false,
      status: 500,
    };
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useOfflineSupport({
      maxRetries: 2,
    }));

    // Add item to queue
    act(() => {
      result.current.addToQueue({
        type: 'quest-completion',
        data: { questId: 'quest-1', completed: true },
      });
    });

    // Process queue (should fail)
    await act(async () => {
      await result.current.processQueue();
    });

    // Item should still be in queue with retry count 1
    expect(result.current.queue).toHaveLength(1);
    expect(result.current.queue[0].retryCount).toBe(1);

    // Process again (should fail again)
    await act(async () => {
      await result.current.processQueue();
    });

    // Item should still be in queue with retry count 2
    expect(result.current.queue).toHaveLength(1);
    expect(result.current.queue[0].retryCount).toBe(2);

    // Process again (should remove item after max retries)
    await act(async () => {
      await result.current.processQueue();
    });

    // Queue should be empty after max retries
    expect(result.current.queue).toHaveLength(0);
  });

  it('should not process queue when offline', async () => {
    navigator.onLine = false;
    const { result } = renderHook(() => useOfflineSupport());

    // Add item to queue
    act(() => {
      result.current.addToQueue({
        type: 'quest-completion',
        data: { questId: 'quest-1', completed: true },
      });
    });

    // Try to process queue
    await act(async () => {
      await result.current.processQueue();
    });

    // Should not make any fetch calls
    expect(global.fetch).not.toHaveBeenCalled();
    expect(result.current.queue).toHaveLength(1);
  });

  it('should not process queue when already processing', async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({ success: true }),
    };
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useOfflineSupport());

    // Add item to queue
    act(() => {
      result.current.addToQueue({
        type: 'quest-completion',
        data: { questId: 'quest-1', completed: true },
      });
    });

    // Start processing
    const processPromise = act(async () => {
      await result.current.processQueue();
    });

    // Try to process again while first is running
    await act(async () => {
      await result.current.processQueue();
    });

    // Should only make one fetch call
    expect(global.fetch).toHaveBeenCalledTimes(1);

    await processPromise;
  });

  it('should clear queue correctly', () => {
    const { result } = renderHook(() => useOfflineSupport());

    // Add items to queue
    act(() => {
      result.current.addToQueue({
        type: 'quest-completion',
        data: { questId: 'quest-1', completed: true },
      });
      result.current.addToQueue({
        type: 'quest-completion',
        data: { questId: 'quest-2', completed: false },
      });
    });

    expect(result.current.queue).toHaveLength(2);

    // Clear queue
    act(() => {
      result.current.clearQueue();
    });

    expect(result.current.queue).toHaveLength(0);
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('offline-quest-queue');
  });

  it('should provide correct queue statistics', () => {
    const { result } = renderHook(() => useOfflineSupport());

    // Add items with different retry counts
    act(() => {
      result.current.addToQueue({
        type: 'quest-completion',
        data: { questId: 'quest-1', completed: true },
      });
      result.current.addToQueue({
        type: 'quest-completion',
        data: { questId: 'quest-2', completed: false },
      });
    });

    // Manually set retry count for second item
    act(() => {
      const queue = result.current.queue;
      queue[1].retryCount = 1;
    });

    const stats = result.current.getQueueStats();
    expect(stats.total).toBe(2);
    expect(stats.pending).toBe(1);
    expect(stats.retrying).toBe(1);
    expect(stats.oldestItem).toBeCloseTo(Date.now(), -2);
  });

  it('should handle localStorage errors gracefully', () => {
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error('localStorage error');
    });

    const { result } = renderHook(() => useOfflineSupport());

    // Should not crash and should have empty queue
    expect(result.current.queue).toEqual([]);
  });

  it('should handle unknown queue item types', async () => {
    const { result } = renderHook(() => useOfflineSupport());

    // Add item with unknown type
    act(() => {
      result.current.addToQueue({
        type: 'unknown-type' as any,
        data: { questId: 'quest-1', completed: true },
      });
    });

    // Process queue
    await act(async () => {
      await result.current.processQueue();
    });

    // Should remove item after max retries
    expect(result.current.queue).toHaveLength(0);
  });
});
