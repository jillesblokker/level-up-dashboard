import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { useQuestCompletion } from '@/hooks/useQuestCompletion';
import { useParticles } from '@/components/ui/particles';

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
  useCustomToggle?: boolean; // New prop to use custom toggle instead of quest completion
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
  useCustomToggle = false,
}: QuestToggleButtonProps) {
  const { toggleQuestCompletion, isQuestPending } = useQuestCompletion();
  const { spawnParticles, spawnFloatingText } = useParticles();
  const lastClickRef = useRef<{ x: number, y: number } | null>(null);

  const isPending = isQuestPending(questId);
  const isDisabled = disabled || isPending;

  const handleClick = (e: React.MouseEvent) => {
    lastClickRef.current = { x: e.clientX, y: e.clientY };
  };

  const triggerEffects = () => {
    if (lastClickRef.current) {
      const { x, y } = lastClickRef.current;

      // Spawn gold particles
      spawnParticles(x, y, 'gold', 8, { color: '#fbbf24' });
      spawnFloatingText(x, y, `+${gold} Gold`, '#fbbf24');

      // Spawn XP particles slightly delayed
      setTimeout(() => {
        spawnParticles(x, y, 'xp', 8, { color: '#60a5fa' });
        spawnFloatingText(x, y - 30, `+${xp} XP`, '#60a5fa');
      }, 200);

      // Spawn confetti
      setTimeout(() => {
        spawnParticles(x, y, 'confetti', 12);
      }, 400);
    }
  };

  const handleToggle = async () => {
    if (isDisabled) return;

    // Trigger effects if we are completing the quest
    if (!completed) {
      triggerEffects();
    }

    console.log('[QuestToggleButton] Debug:', {
      questId,
      questName,
      useCustomToggle,
      context: useCustomToggle ? 'custom' : 'quest-completion'
    });

    if (useCustomToggle) {
      // Use the custom toggle function (for challenges, milestones, etc.)
      console.log('[QuestToggleButton] Using custom toggle for:', questName);
      onToggle(questId, !completed);
    } else {
      // Use the quest completion system (for regular quests)
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
    }
  };

  if (variant === 'checkbox') {
    return (
      <div className="flex items-center space-x-2">
        <div onClick={handleClick}>
          <Checkbox
            id={`quest-${questId}`}
            checked={completed}
            onCheckedChange={handleToggle}
            disabled={isDisabled}
            className="h-4 w-4"
          />
        </div>
        {isPending && (
          <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
        )}
      </div>
    );
  }

  return (
    <Button
      onClick={(e) => {
        handleClick(e);
        handleToggle();
      }}
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
