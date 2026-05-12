'use client'

import { logger } from "@/lib/logger";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Heart, Sparkles, Wind } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnimalInteractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  animalType: 'horse' | 'sheep' | 'penguin' | 'eagle';
  animalName: string;
  onInteract: () => void;
  availableFood?: Array<{ id: string; name: string }>;
  onFeed: (itemId: string) => void;
}

/** Converts a raw filename like "fish-red.webp" into "Fish Red" */
function formatFoodName(raw: string): string {
  return raw
    .replace(/\.[^/.]+$/, '')        // strip extension
    .replace(/[-_]/g, ' ')            // dashes → spaces
    .replace(/\b\w/g, c => c.toUpperCase()); // Title Case
}

export function AnimalInteractionModal({
  isOpen,
  onClose,
  animalType,
  animalName,
  onInteract,
  availableFood,
  onFeed,
}: AnimalInteractionModalProps) {
  const [isInteracting, setIsInteracting] = useState(false);

  const handleInteract = async () => {
    setIsInteracting(true);
    try {
      await onInteract();
      onClose();
    } catch (error) {
      logger.error('Animal interaction failed:', error);
    } finally {
      setIsInteracting(false);
    }
  };

  const getAnimalImage = (): string => {
    if (animalType === 'horse') {
      const horseImages: string[] = [
        '/images/items/horse/horse-stelony.webp',
        '/images/items/horse/horse-perony.webp',
        '/images/items/horse/horse-felony.webp'
      ];
      return horseImages[Math.floor(Math.random() * horseImages.length)]!;
    }
    return `/images/Animals/${animalType}.webp`;
  };

  const getAnimalDescription = () => {
    switch (animalType) {
      case 'horse':
        return "A magnificent wild horse grazes nearby. Its coat shimmers in the sunlight, and there's a spark of untamed spirit in its eyes.";
      case 'sheep':
        return "A fluffy sheep looks up at you with curious, gentle eyes. Its wool is thick and pristine—a valuable find for any traveler.";
      case 'penguin':
        return "An adorable penguin waddles across the ice with comical determination. It seems friendly and eager to play!";
      case 'eagle':
        return "A majestic eagle surveys its domain from above. Its piercing gaze suggests ancient wisdom.";
      default:
        return "You've encountered a wild creature!";
    }
  };

  const getActionButtonText = () => {
    switch (animalType) {
      case 'horse':   return 'Tame';
      case 'sheep':   return 'Pet';
      case 'penguin': return 'Play';
      case 'eagle':   return 'Call';
      default:        return 'Interact';
    }
  };

  const getBiomeStyle = () => {
    switch (animalType) {
      case 'horse':
        return {
          gradient: 'from-emerald-950/90 via-zinc-950 to-zinc-950',
          border: 'border-emerald-700/30',
          shadow: 'shadow-emerald-500/10',
          accent: 'text-emerald-400',
          accentBg: 'bg-emerald-900/30',
          button: 'bg-emerald-600 hover:bg-emerald-500'
        };
      case 'penguin':
        return {
          gradient: 'from-blue-950/90 via-zinc-950 to-zinc-950',
          border: 'border-blue-700/30',
          shadow: 'shadow-blue-500/10',
          accent: 'text-blue-400',
          accentBg: 'bg-blue-900/30',
          button: 'bg-blue-600 hover:bg-blue-500'
        };
      case 'eagle':
        return {
          gradient: 'from-amber-950/90 via-zinc-950 to-zinc-950',
          border: 'border-amber-700/30',
          shadow: 'shadow-amber-500/10',
          accent: 'text-amber-400',
          accentBg: 'bg-amber-900/30',
          button: 'bg-amber-600 hover:bg-amber-500'
        };
      default:
        return {
          gradient: 'from-amber-950/90 via-zinc-950 to-zinc-950',
          border: 'border-amber-700/30',
          shadow: 'shadow-amber-500/10',
          accent: 'text-amber-400',
          accentBg: 'bg-amber-900/30',
          button: 'bg-amber-600 hover:bg-amber-500'
        };
    }
  };

  const style = getBiomeStyle();
  const firstFood = availableFood?.[0];
  const foodLabel = firstFood ? formatFoodName(firstFood.name || firstFood.id) : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          // Fixed width so it never spills off-screen; padding keeps content inside
          "w-[min(90vw,400px)] max-w-none p-0 overflow-hidden shadow-2xl rounded-2xl",
          `bg-gradient-to-b ${style.gradient} ${style.border} ${style.shadow}`
        )}
        role="dialog"
        aria-label="animal-interaction-modal"
      >
        {/* Hidden a11y header */}
        <DialogHeader className="sr-only">
          <DialogTitle>{animalName}</DialogTitle>
          <DialogDescription>Wild animal encounter</DialogDescription>
        </DialogHeader>

        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className={cn("absolute top-1/4 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl opacity-20", style.accentBg)} />
        </div>

        {/* ── Animal portrait ── */}
        <div className="relative z-10 flex flex-col items-center pt-10 pb-6 px-6">
          <div className="relative group">
            {/* Pulsing glow */}
            <div className={cn("absolute inset-0 rounded-full blur-3xl animate-pulse scale-150 opacity-20", style.accentBg)} />
            {/* Rotating ring */}
            <div
              className={cn("absolute -inset-4 border border-dashed rounded-full opacity-30", style.accent)}
              style={{ animation: 'spin 15s linear infinite' }}
            />
            {/* Portrait circle */}
            <div className={cn("relative w-40 h-40 rounded-full border-4 shadow-2xl overflow-hidden p-1 bg-zinc-900 group-hover:scale-105 transition-transform duration-500", style.border)}>
              <div className="relative w-full h-full rounded-full overflow-hidden border border-white/10">
                <Image
                  src={getAnimalImage()}
                  alt={`${animalName} animal`}
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-40" />
              </div>
            </div>
            {/* Sparkle decorations */}
            <Sparkles className={cn("absolute -top-3 -right-3 w-5 h-5 animate-pulse opacity-60", style.accent)} />
            <Wind className={cn("absolute -bottom-2 -left-3 w-5 h-5 animate-pulse opacity-40", style.accent)} style={{ animationDelay: '0.5s' }} />
          </div>

          {/* ── Name & description ── */}
          <h2 className={cn("mt-6 text-2xl font-serif font-semibold text-center", style.accent)}>
            {animalName}
          </h2>
          <p className="mt-2 text-zinc-300/80 text-sm leading-relaxed text-center">
            {getAnimalDescription()}
          </p>
        </div>

        {/* ── Action buttons ── */}
        {/* Stack vertically on mobile, row on sm+ — but cap label length so they never overflow */}
        <div className="relative z-10 flex flex-col gap-2 px-6 pb-6">
          {/* Primary action */}
          <Button
            onClick={handleInteract}
            disabled={isInteracting}
            className={cn(
              "w-full h-11 text-white rounded-xl gap-2 shadow-lg",
              style.button,
              isInteracting && "opacity-70"
            )}
          >
            {isInteracting ? (
              <><Sparkles className="w-4 h-4 animate-spin" /> Approaching…</>
            ) : (
              <><Heart className="w-4 h-4" /> {getActionButtonText()}</>
            )}
          </Button>

          {/* Feed button — only shown when food is available */}
          {firstFood && foodLabel && (
            <Button
              onClick={() => onFeed(firstFood.id)}
              disabled={isInteracting}
              className={cn(
                "w-full h-11 text-white rounded-xl gap-2 bg-orange-600 hover:bg-orange-500 shadow-lg",
                isInteracting && "opacity-70"
              )}
            >
              <span className="text-base leading-none">🍎</span>
              <span className="truncate">Feed {foodLabel}</span>
            </Button>
          )}

          {/* Cancel */}
          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full h-10 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 rounded-xl"
          >
            Leave Alone
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
