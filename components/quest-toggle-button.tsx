import React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { useQuestCompletion } from '@/hooks/useQuestCompletion';

interface QuestToggleButtonProps {
  questId: string;
  questName: string;
  completed: boolean;
  xp?: number;
  gold?: number;
  category?: string;
  onToggle: (questId: string, newCompleted: boolean) => void;
  disabled?: boolean;
  variant?: 'checkbox' | 'button';
}

export function QuestToggleButton({
  questId,
  questName,
  completed,
  xp = 50,
  gold = 25,
  category,
  onToggle,
  disabled = false,
  variant = 'checkbox',
}: QuestToggleButtonProps) {
  const { toggleQuestCompletion, isQuestPending } = useQuestCompletion();
  
  const isPending = isQuestPending(questId);
  const isDisabled = disabled || isPending;

  const handleToggle = async () => {
    if (isDisabled) return;

    const result = await toggleQuestCompletion(
      questId,
      completed,
      { name: questName, xp, gold, category: category || 'general' },
      (newCompleted) => {
        // Success callback - update parent state
        onToggle(questId, newCompleted);
      },
      (error) => {
        // Error callback - parent can handle if needed
        console.error('[Quest Toggle Button] Error:', error);
      }
    );

    // If the API call failed, don't update the parent state
    // The optimistic update will be reverted by the hook
    if (!result.success) {
      console.error('[Quest Toggle Button] Failed to toggle quest:', result.error);
    }
  };

  if (variant === 'checkbox') {
    return (
      <div className="flex items-center space-x-2">
        <Checkbox
          id={`quest-${questId}`}
          checked={completed}
          onCheckedChange={handleToggle}
          disabled={isDisabled}
          className="h-4 w-4"
        />
        {isPending && (
          <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
        )}
      </div>
    );
  }

  return (
    <Button
      onClick={handleToggle}
      disabled={isDisabled}
      variant={completed ? "default" : "outline"}
      size="sm"
      className="min-w-[80px]"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : completed ? (
        "Completed"
      ) : (
        "Complete"
      )}
    </Button>
  );
}
