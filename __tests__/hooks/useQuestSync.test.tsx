import { renderHook, act, waitFor } from '@testing-library/react';
import { useQuestSync } from '@/hooks/useQuestSync';

// Mock the useRealtimeSync hook
jest.mock('@/hooks/useRealtimeSync', () => ({
  useRealtimeSync: jest.fn(),
}));

import { useRealtimeSync } from '@/hooks/useRealtimeSync';

const mockUseRealtimeSync = useRealtimeSync as jest.MockedFunction<typeof useRealtimeSync>;

describe('useQuestSync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with correct default state', () => {
    mockUseRealtimeSync.mockReturnValue({
      syncNow: jest.fn(),
      isSyncing: false,
      lastSync: 0,
    });

    const { result } = renderHook(() => useQuestSync({
      onQuestsUpdate: jest.fn(),
      onCharacterStatsUpdate: jest.fn(),
    }));

    expect(result.current.isSyncing).toBe(false);
    expect(result.current.lastSync).toBe(0);
    expect(typeof result.current.syncNow).toBe('function');
  });

  it('should call both quest and character stats updates on sync', async () => {
    const mockQuestsUpdate = jest.fn().mockResolvedValue(undefined);
    const mockCharacterStatsUpdate = jest.fn().mockResolvedValue(undefined);
    const mockSyncNow = jest.fn();

    mockUseRealtimeSync.mockReturnValue({
      syncNow: mockSyncNow,
      isSyncing: false,
      lastSync: 0,
    });

    const { result } = renderHook(() => useQuestSync({
      onQuestsUpdate: mockQuestsUpdate,
      onCharacterStatsUpdate: mockCharacterStatsUpdate,
    }));

    // Get the sync function that was passed to useRealtimeSync
    const syncFunction = mockUseRealtimeSync.mock.calls[0][0].onSync;

    // Call the sync function
    await act(async () => {
      await syncFunction();
    });

    expect(mockQuestsUpdate).toHaveBeenCalledTimes(1);
    expect(mockCharacterStatsUpdate).toHaveBeenCalledTimes(1);
  });

  it('should handle quest update errors', async () => {
    const mockQuestsUpdate = jest.fn().mockRejectedValue(new Error('Quest update failed'));
    const mockCharacterStatsUpdate = jest.fn().mockResolvedValue(undefined);
    const mockOnError = jest.fn();

    mockUseRealtimeSync.mockReturnValue({
      syncNow: jest.fn(),
      isSyncing: false,
      lastSync: 0,
    });

    const { result } = renderHook(() => useQuestSync({
      onQuestsUpdate: mockQuestsUpdate,
      onCharacterStatsUpdate: mockCharacterStatsUpdate,
      onError: mockOnError,
    }));

    // Get the sync function that was passed to useRealtimeSync
    const syncFunction = mockUseRealtimeSync.mock.calls[0][0].onSync;

    // Call the sync function
    await act(async () => {
      await syncFunction();
    });

    expect(mockOnError).toHaveBeenCalledWith(expect.any(Error));
    expect(mockCharacterStatsUpdate).not.toHaveBeenCalled();
  });

  it('should handle character stats update errors', async () => {
    const mockQuestsUpdate = jest.fn().mockResolvedValue(undefined);
    const mockCharacterStatsUpdate = jest.fn().mockRejectedValue(new Error('Character stats update failed'));
    const mockOnError = jest.fn();

    mockUseRealtimeSync.mockReturnValue({
      syncNow: jest.fn(),
      isSyncing: false,
      lastSync: 0,
    });

    const { result } = renderHook(() => useQuestSync({
      onQuestsUpdate: mockQuestsUpdate,
      onCharacterStatsUpdate: mockCharacterStatsUpdate,
      onError: mockOnError,
    }));

    // Get the sync function that was passed to useRealtimeSync
    const syncFunction = mockUseRealtimeSync.mock.calls[0][0].onSync;

    // Call the sync function
    await act(async () => {
      await syncFunction();
    });

    expect(mockOnError).toHaveBeenCalledWith(expect.any(Error));
    expect(mockQuestsUpdate).toHaveBeenCalledTimes(1);
  });

  it('should work without character stats update callback', async () => {
    const mockQuestsUpdate = jest.fn().mockResolvedValue(undefined);

    mockUseRealtimeSync.mockReturnValue({
      syncNow: jest.fn(),
      isSyncing: false,
      lastSync: 0,
    });

    const { result } = renderHook(() => useQuestSync({
      onQuestsUpdate: mockQuestsUpdate,
    }));

    // Get the sync function that was passed to useRealtimeSync
    const syncFunction = mockUseRealtimeSync.mock.calls[0][0].onSync;

    // Call the sync function
    await act(async () => {
      await syncFunction();
    });

    expect(mockQuestsUpdate).toHaveBeenCalledTimes(1);
  });

  it('should work without quest update callback', async () => {
    const mockCharacterStatsUpdate = jest.fn().mockResolvedValue(undefined);

    mockUseRealtimeSync.mockReturnValue({
      syncNow: jest.fn(),
      isSyncing: false,
      lastSync: 0,
    });

    const { result } = renderHook(() => useQuestSync({
      onCharacterStatsUpdate: mockCharacterStatsUpdate,
    }));

    // Get the sync function that was passed to useRealtimeSync
    const syncFunction = mockUseRealtimeSync.mock.calls[0][0].onSync;

    // Call the sync function
    await act(async () => {
      await syncFunction();
    });

    expect(mockCharacterStatsUpdate).toHaveBeenCalledTimes(1);
  });

  it('should work without any callbacks', async () => {
    mockUseRealtimeSync.mockReturnValue({
      syncNow: jest.fn(),
      isSyncing: false,
      lastSync: 0,
    });

    const { result } = renderHook(() => useQuestSync({}));

    // Get the sync function that was passed to useRealtimeSync
    const syncFunction = mockUseRealtimeSync.mock.calls[0][0].onSync;

    // Call the sync function - should not throw
    await act(async () => {
      await syncFunction();
    });

    // Should complete successfully
    expect(true).toBe(true);
  });

  it('should pass through syncNow function', () => {
    const mockSyncNow = jest.fn();

    mockUseRealtimeSync.mockReturnValue({
      syncNow: mockSyncNow,
      isSyncing: false,
      lastSync: 0,
    });

    const { result } = renderHook(() => useQuestSync({
      onQuestsUpdate: jest.fn(),
      onCharacterStatsUpdate: jest.fn(),
    }));

    expect(result.current.syncNow).toBe(mockSyncNow);
  });

  it('should pass through isSyncing state', () => {
    mockUseRealtimeSync.mockReturnValue({
      syncNow: jest.fn(),
      isSyncing: true,
      lastSync: 0,
    });

    const { result } = renderHook(() => useQuestSync({
      onQuestsUpdate: jest.fn(),
      onCharacterStatsUpdate: jest.fn(),
    }));

    expect(result.current.isSyncing).toBe(true);
  });

  it('should pass through lastSync timestamp', () => {
    const mockLastSync = Date.now();

    mockUseRealtimeSync.mockReturnValue({
      syncNow: jest.fn(),
      isSyncing: false,
      lastSync: mockLastSync,
    });

    const { result } = renderHook(() => useQuestSync({
      onQuestsUpdate: jest.fn(),
      onCharacterStatsUpdate: jest.fn(),
    }));

    expect(result.current.lastSync).toBe(mockLastSync);
  });

  it('should configure useRealtimeSync with correct options', () => {
    mockUseRealtimeSync.mockReturnValue({
      syncNow: jest.fn(),
      isSyncing: false,
      lastSync: 0,
    });

    renderHook(() => useQuestSync({
      onQuestsUpdate: jest.fn(),
      onCharacterStatsUpdate: jest.fn(),
    }));

    // Check that useRealtimeSync was called with correct options
    const options = mockUseRealtimeSync.mock.calls[0][1];
    expect(options).toEqual({
      enabled: true,
      intervalMs: 30000,
      onVisibilityChange: true,
      onFocus: true,
    });
  });
});
