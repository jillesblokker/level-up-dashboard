import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useOfflineSupport } from './useOfflineSupport';
import { useQuestToasts } from '@/components/enhanced-toast-system';

interface QuestCompletionState {
  isLoading: boolean;
  error: string | null;
  pendingQuests: Set<string>; // Track which quests are being processed
}

interface QuestCompletionResult {
  success: boolean;
  error?: string;
  data?: any;
}

export function useQuestCompletion() {
  const [state, setState] = useState<QuestCompletionState>({
    isLoading: false,
    error: null,
    pendingQuests: new Set(),
  });
  
  const { toast } = useToast();
  const { isOnline, addToQueue } = useOfflineSupport();
  const questToasts = useQuestToasts();

  const toggleQuestCompletion = useCallback(async (
    questId: string,
    currentCompleted: boolean,
    questData: { name: string; xp?: number; gold?: number; category?: string },
    onSuccess?: (newCompleted: boolean) => void,
    onError?: (error: string) => void
  ): Promise<QuestCompletionResult> => {
    const newCompleted = !currentCompleted;
    
    // Prevent duplicate requests
    if (state.pendingQuests.has(questId)) {
      console.log('[Quest Completion] Request already pending for quest:', questId);
      return { success: false, error: 'Request already in progress' };
    }

    // Add to pending set
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      pendingQuests: new Set([...prev.pendingQuests, questId]),
    }));

    try {
      console.log('[Quest Completion] Starting quest toggle:', { 
        questId, 
        currentCompleted, 
        newCompleted,
        questName: questData.name,
        isOnline
      });

      // If offline, add to queue and show optimistic update
      if (!isOnline) {
        console.log('[Quest Completion] Offline - adding to queue');
        addToQueue({
          type: 'quest-completion',
          data: {
            questId,
            completed: newCompleted,
            ...(questData.xp !== undefined && { xp: questData.xp }),
            ...(questData.gold !== undefined && { gold: questData.gold }),
            ...(questData.category !== undefined && { category: questData.category }),
          },
        });

        // Show offline toast
        questToasts.showOfflineQuest(questData.name);

        // Call success callback for optimistic update
        onSuccess?.(newCompleted);

        return { success: true, data: { offline: true } };
      }

      // Make API call (online)
      const response = await fetch('/api/quests/smart-completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questId,
          completed: newCompleted,
          xpReward: questData.xp || 50,
          goldReward: questData.gold || 25,
        }),
      });

      console.log('[Quest Completion] Response received:', { 
        status: response.status, 
        ok: response.ok 
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Failed to update quest (${response.status})`;
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      console.log('[Quest Completion] Response data:', responseData);

      // Success - show appropriate toast
      if (newCompleted) {
        questToasts.showQuestCompleted(
          questData.name,
          questData.xp || 50,
          questData.gold || 25
        );
      } else {
        toast({
          title: "Quest Uncompleted",
          description: `${questData.name} has been marked as incomplete.`,
          duration: 2000,
        });
      }

      // Call success callback
      onSuccess?.(newCompleted);

      return { success: true, data: responseData };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('[Quest Completion] Error:', errorMessage);

      // Show error toast
      questToasts.showQuestError(questData.name, errorMessage);

      // Call error callback
      onError?.(errorMessage);

      return { success: false, error: errorMessage };

    } finally {
      // Remove from pending set
      setState(prev => ({
        ...prev,
        isLoading: false,
        pendingQuests: new Set([...prev.pendingQuests].filter(id => id !== questId)),
      }));
    }
  }, [state.pendingQuests, toast]);

  const isQuestPending = useCallback((questId: string) => {
    return state.pendingQuests.has(questId);
  }, [state.pendingQuests]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    toggleQuestCompletion,
    isQuestPending,
    isLoading: state.isLoading,
    error: state.error,
    clearError,
  };
}
