import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useOfflineSupport } from './useOfflineSupport';
import { useQuestToasts } from '@/components/enhanced-toast-system';
import { getTodaysCard } from '@/lib/tarot-data';

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

      // Calculate bonuses from Tarot
      const activeCard = getTodaysCard();
      let xpReward = questData.xp || 50;
      let goldReward = questData.gold || 25;

      if (activeCard && newCompleted) {
        const { effect } = activeCard;
        const category = questData.category?.toLowerCase();

        let applyBonus = false;
        if (effect.type === 'xp_boost' || effect.type === 'gold_boost' || effect.type === 'mixed') {
          applyBonus = true;
        } else if (effect.type === 'category_boost' && effect.category && category) {
          // Simple category matching
          if (category.includes(effect.category.toLowerCase())) {
            applyBonus = true;
          }
        }

        if (applyBonus) {
          if (effect.xpMultiplier) xpReward = Math.floor(xpReward * effect.xpMultiplier);
          if (effect.goldMultiplier) goldReward = Math.floor(goldReward * effect.goldMultiplier);
          console.log('[Quest Completion] Applied Tarot Bonus:', { card: activeCard.name, xpReward, goldReward });
        }
      }

      // If offline, add to queue and show optimistic update
      if (!isOnline) {
        console.log('[Quest Completion] Offline - adding to queue');
        addToQueue({
          type: 'quest-completion',
          data: {
            questId,
            completed: newCompleted,
            xp: xpReward,
            gold: goldReward,
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
          xpReward,
          goldReward,
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
        // Use verified rewards from server if available
        const finalXP = responseData.verifiedRewards?.xp ?? xpReward;
        const finalGold = responseData.verifiedRewards?.gold ?? goldReward;

        // Show Quest Completed Toast with UNDO action
        const toastId = questToasts.addToast({
          type: 'success',
          title: 'Quest Completed! 🎉',
          description: `${questData.name} completed! +${finalXP} XP, +${finalGold} Gold`,
          duration: 5000,
          action: {
            label: 'Undo',
            onClick: () => {
              // Trigger toggle again to revert
              console.log('[Quest Completion] Undoing completion for:', questId);
              toggleQuestCompletion(questId, true, questData, onSuccess, onError);
            }
          }
        });

        // DISPATCH EVENT for graph and stats update
        import('@/lib/kingdom-events').then(mod => {
          mod.emitQuestCompletedWithRewards(
            questData.name,
            finalGold,
            finalXP,
            'quest-completion'
          );
        });
      } else {
        toast({
          title: "Quest Uncompleted",
          description: `${questData.name} has been marked as incomplete.`,
          duration: 2000,
        });
      }

      // Call success callback
      onSuccess?.(newCompleted);

      // Optimistically update character stats
      if (newCompleted) {
        try {
          const { addToCharacterStat } = await import('@/lib/character-stats-service');
          if (xpReward) addToCharacterStat('experience', xpReward, 'quest:complete');
          if (goldReward) addToCharacterStat('gold', goldReward, 'quest:complete');
          console.log('[Quest Completion] Optimistically updated stats');
        } catch (statsError) {
          console.error('[Quest Completion] Failed to update local stats:', statsError);
        }
      }

      // Refresh character stats to update the UI
      if (newCompleted) {
        try {
          const { fetchFreshCharacterStats } = await import('@/lib/character-stats-service');
          await fetchFreshCharacterStats();
          console.log('[Quest Completion] Character stats refreshed');
        } catch (statsError) {
          console.error('[Quest Completion] Failed to refresh stats:', statsError);
          // Don't fail the quest completion if stats refresh fails
        }
      }

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
