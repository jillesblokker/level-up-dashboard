import { renderHook, act, waitFor } from '@testing-library/react';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';

// Mock timers
jest.useFakeTimers();

describe('useRealtimeSync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    
    // Mock document.visibilityState
    Object.defineProperty(document, 'visibilityState', {
      writable: true,
      value: 'visible',
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('should initialize with correct default state', () => {
    const mockSync = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useRealtimeSync({
      onSync: mockSync,
    }));

    expect(result.current.isSyncing).toBe(false);
    expect(result.current.lastSync).toBe(0);
  });

  it('should start polling when enabled and visible', () => {
    const mockSync = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useRealtimeSync({
      onSync: mockSync,
    }));

    // Fast-forward time to trigger first poll
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    expect(mockSync).toHaveBeenCalledTimes(1);
  });

  it('should not poll when disabled', () => {
    const mockSync = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useRealtimeSync({
      onSync: mockSync,
    }, {
      enabled: false,
    }));

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(60000);
    });

    expect(mockSync).not.toHaveBeenCalled();
  });

  it('should not poll when page is not visible', () => {
    const mockSync = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useRealtimeSync({
      onSync: mockSync,
    }));

    // Simulate page becoming hidden
    act(() => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(60000);
    });

    expect(mockSync).not.toHaveBeenCalled();
  });

  it('should resume polling when page becomes visible', () => {
    const mockSync = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useRealtimeSync({
      onSync: mockSync,
    }));

    // Simulate page becoming hidden
    act(() => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // Simulate page becoming visible again
    act(() => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    expect(mockSync).toHaveBeenCalledTimes(1);
  });

  it('should sync immediately when page becomes visible if enough time has passed', async () => {
    const mockSync = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useRealtimeSync({
      onSync: mockSync,
    }));

    // Simulate page becoming hidden
    act(() => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // Fast-forward time to make it seem like a long time has passed
    act(() => {
      jest.advanceTimersByTime(60000);
    });

    // Simulate page becoming visible again
    act(() => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // Should sync immediately
    await waitFor(() => {
      expect(mockSync).toHaveBeenCalledTimes(1);
    });
  });

  it('should sync on window focus', async () => {
    const mockSync = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useRealtimeSync({
      onSync: mockSync,
    }));

    // Simulate window focus
    act(() => {
      window.dispatchEvent(new Event('focus'));
    });

    await waitFor(() => {
      expect(mockSync).toHaveBeenCalledTimes(1);
    });
  });

  it('should not sync on focus if recent sync occurred', () => {
    const mockSync = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useRealtimeSync({
      onSync: mockSync,
    }));

    // Trigger initial sync
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    expect(mockSync).toHaveBeenCalledTimes(1);

    // Simulate window focus immediately after
    act(() => {
      window.dispatchEvent(new Event('focus'));
    });

    // Should not sync again
    expect(mockSync).toHaveBeenCalledTimes(1);
  });

  it('should handle sync errors gracefully', async () => {
    const mockError = new Error('Sync failed');
    const mockSync = jest.fn().mockRejectedValue(mockError);
    const mockOnError = jest.fn();

    const { result } = renderHook(() => useRealtimeSync({
      onSync: mockSync,
      onError: mockOnError,
    }));

    // Trigger sync
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(mockError);
    });
  });

  it('should prevent concurrent syncs', async () => {
    const mockSync = jest.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 1000))
    );

    const { result } = renderHook(() => useRealtimeSync({
      onSync: mockSync,
    }));

    // Trigger first sync
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    // Try to trigger second sync immediately
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    // Should only call sync once
    expect(mockSync).toHaveBeenCalledTimes(1);
  });

  it('should update lastSync timestamp on successful sync', async () => {
    const mockSync = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useRealtimeSync({
      onSync: mockSync,
    }));

    const initialLastSync = result.current.lastSync;

    // Trigger sync
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    await waitFor(() => {
      expect(result.current.lastSync).toBeGreaterThan(initialLastSync);
    });
  });

  it('should provide manual sync function', async () => {
    const mockSync = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useRealtimeSync({
      onSync: mockSync,
    }));

    // Manual sync
    await act(async () => {
      await result.current.syncNow();
    });

    expect(mockSync).toHaveBeenCalledTimes(1);
  });

  it('should use custom interval', () => {
    const mockSync = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useRealtimeSync({
      onSync: mockSync,
    }, {
      intervalMs: 10000,
    }));

    // Fast-forward by custom interval
    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(mockSync).toHaveBeenCalledTimes(1);
  });

  it('should clean up timers on unmount', () => {
    const mockSync = jest.fn().mockResolvedValue(undefined);
    const { result, unmount } = renderHook(() => useRealtimeSync({
      onSync: mockSync,
    }));

    unmount();

    // Fast-forward time after unmount
    act(() => {
      jest.advanceTimersByTime(60000);
    });

    // Should not call sync after unmount
    expect(mockSync).not.toHaveBeenCalled();
  });
});
