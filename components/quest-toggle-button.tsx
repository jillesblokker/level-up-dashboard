import { logger } from "@/lib/logger";
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuestCompletion } from '@/hooks/useQuestCompletion';
import { useParticles } from '@/components/ui/particles';
import { useQuestAudio } from '@/components/audio-provider';
import { useHaptics, HapticPatterns } from '@/lib/haptics';

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
  const { onQuestComplete, onButtonClick } = useQuestAudio();
  const { trigger } = useHaptics();
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

      // Audio & Haptics
      onQuestComplete();
      trigger(HapticPatterns.questComplete);
    }
  };

  const handleToggle = async () => {
    if (isDisabled) return;

    onButtonClick();

    // Trigger effects if we are completing the quest
    if (!completed) {
      triggerEffects();
    } else {
      trigger(HapticPatterns.soft);
    }

    logger.debug('[QuestToggleButton] Debug:', {
      questId,
      questName,
      useCustomToggle,
      context: 'direct-onToggle'
    });

    // Delegate to parent onToggle callback to prevent duplicate API requests
    onToggle(questId, !completed);
  };

  if (variant === 'checkbox') {
    return (
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={(e) => {
            if (isDisabled) return;
            handleClick(e);
            handleToggle();
          }}
          disabled={isDisabled}
          className={cn(
            "w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-amber-500/50",
            isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:scale-110 hover:shadow-md",
            completed
              ? "bg-green-500 border-green-500 text-white"
              : "bg-transparent border-zinc-500 text-transparent hover:border-amber-400"
          )}
          aria-label={`Toggle quest completion: ${questName}`}
        >
          {completed ? (
            <CheckCircle className="h-3.5 w-3.5 stroke-[3]" />
          ) : (
            <div className="w-2.5 h-2.5 rounded-sm border border-zinc-600 transition-colors" />
          )}
        </button>
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
