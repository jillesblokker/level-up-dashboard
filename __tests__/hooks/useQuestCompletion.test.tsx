import { renderHook, act, waitFor } from '@testing-library/react';
import { useQuestCompletion } from '@/hooks/useQuestCompletion';
import { useToast } from '@/hooks/use-toast';
import { useOfflineSupport } from '@/hooks/useOfflineSupport';

// Mock dependencies
jest.mock('@/hooks/use-toast');
jest.mock('@/hooks/useOfflineSupport');

const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;
const mockUseOfflineSupport = useOfflineSupport as jest.MockedFunction<typeof useOfflineSupport>;

describe('useQuestCompletion', () => {
  const mockToast = jest.fn();
  const mockAddToQueue = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock fetch globally
    global.fetch = jest.fn();
    
    // Mock toast hook
    mockUseToast.mockReturnValue({
      toast: mockToast,
    });
    
    // Mock offline support hook
    mockUseOfflineSupport.mockReturnValue({
      isOnline: true,
      addToQueue: mockAddToQueue,
      queue: [],
      isProcessing: false,
      processQueue: jest.fn(),
      clearQueue: jest.fn(),
      getQueueStats: jest.fn(() => ({ total: 0, pending: 0, retrying: 0, oldestItem: null })),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useQuestCompletion());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.isQuestPending('test-quest')).toBe(false);
  });

  it('should complete quest successfully when online', async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({ success: true }),
    };
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useQuestCompletion());

    const questData = {
      name: 'Test Quest',
      xp: 50,
      gold: 25,
      category: 'might',
    };

    let completionResult: any;
    await act(async () => {
      completionResult = await result.current.toggleQuestCompletion(
        'test-quest',
        false,
        questData,
        jest.fn(),
        jest.fn()
      );
    });

    expect(completionResult.success).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith('/api/quests/smart-completion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        questId: 'test-quest',
        completed: true,
        xpReward: 50,
        goldReward: 25,
      }),
    });
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Quest Completed! 🎉',
      description: 'Test Quest completed! +50 XP, +25 Gold',
      duration: 3000,
    });
  });

  it('should handle quest completion failure', async () => {
    const mockResponse = {
      ok: false,
      status: 500,
      text: jest.fn().mockResolvedValue('Internal Server Error'),
    };
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useQuestCompletion());

    const questData = {
      name: 'Test Quest',
      xp: 50,
      gold: 25,
      category: 'might',
    };

    let completionResult: any;
    await act(async () => {
      completionResult = await result.current.toggleQuestCompletion(
        'test-quest',
        false,
        questData,
        jest.fn(),
        jest.fn()
      );
    });

    expect(completionResult.success).toBe(false);
    expect(completionResult.error).toContain('Failed to update quest (500)');
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Error',
      description: 'Failed to update Test Quest. Failed to update quest (500)',
      duration: 4000,
      variant: 'destructive',
    });
  });

  it('should handle offline scenario', async () => {
    // Mock offline state
    mockUseOfflineSupport.mockReturnValue({
      isOnline: false,
      addToQueue: mockAddToQueue,
      queue: [],
      isProcessing: false,
      processQueue: jest.fn(),
      clearQueue: jest.fn(),
      getQueueStats: jest.fn(() => ({ total: 0, pending: 0, retrying: 0, oldestItem: null })),
    });

    const { result } = renderHook(() => useQuestCompletion());

    const questData = {
      name: 'Test Quest',
      xp: 50,
      gold: 25,
      category: 'might',
    };

    let completionResult: any;
    await act(async () => {
      completionResult = await result.current.toggleQuestCompletion(
        'test-quest',
        false,
        questData,
        jest.fn(),
        jest.fn()
      );
    });

    expect(completionResult.success).toBe(true);
    expect(completionResult.data.offline).toBe(true);
    expect(mockAddToQueue).toHaveBeenCalledWith({
      type: 'quest-completion',
      data: {
        questId: 'test-quest',
        completed: true,
        xp: 50,
        gold: 25,
        category: 'might',
      },
    });
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Offline Mode',
      description: 'Test Quest will be synced when you\'re back online.',
      duration: 3000,
    });
  });

  it('should prevent duplicate requests for same quest', async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({ success: true }),
    };
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useQuestCompletion());

    const questData = {
      name: 'Test Quest',
      xp: 50,
      gold: 25,
      category: 'might',
    };

    // Start first request
    let firstPromise: Promise<any>;
    act(() => {
      firstPromise = result.current.toggleQuestCompletion(
        'test-quest',
        false,
        questData,
        jest.fn(),
        jest.fn()
      );
    });

    // Try to start second request immediately
    let secondResult: any;
    act(() => {
      secondResult = result.current.toggleQuestCompletion(
        'test-quest',
        false,
        questData,
        jest.fn(),
        jest.fn()
      );
    });

    expect(secondResult.success).toBe(false);
    expect(secondResult.error).toBe('Request already in progress');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should track pending quests correctly', async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({ success: true }),
    };
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useQuestCompletion());

    const questData = {
      name: 'Test Quest',
      xp: 50,
      gold: 25,
      category: 'might',
    };

    // Start request
    act(() => {
      result.current.toggleQuestCompletion(
        'test-quest',
        false,
        questData,
        jest.fn(),
        jest.fn()
      );
    });

    // Check if quest is pending
    expect(result.current.isQuestPending('test-quest')).toBe(true);
    expect(result.current.isQuestPending('other-quest')).toBe(false);

    // Wait for completion
    await waitFor(() => {
      expect(result.current.isQuestPending('test-quest')).toBe(false);
    });
  });

  it('should call success callback on successful completion', async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({ success: true }),
    };
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useQuestCompletion());

    const questData = {
      name: 'Test Quest',
      xp: 50,
      gold: 25,
      category: 'might',
    };

    const mockSuccessCallback = jest.fn();

    await act(async () => {
      await result.current.toggleQuestCompletion(
        'test-quest',
        false,
        questData,
        mockSuccessCallback,
        jest.fn()
      );
    });

    expect(mockSuccessCallback).toHaveBeenCalledWith(true);
  });

  it('should call error callback on failure', async () => {
    const mockResponse = {
      ok: false,
      status: 500,
      text: jest.fn().mockResolvedValue('Internal Server Error'),
    };
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useQuestCompletion());

    const questData = {
      name: 'Test Quest',
      xp: 50,
      gold: 25,
      category: 'might',
    };

    const mockErrorCallback = jest.fn();

    await act(async () => {
      await result.current.toggleQuestCompletion(
        'test-quest',
        false,
        questData,
        jest.fn(),
        mockErrorCallback
      );
    });

    expect(mockErrorCallback).toHaveBeenCalledWith(expect.stringContaining('Failed to update quest'));
  });
});
