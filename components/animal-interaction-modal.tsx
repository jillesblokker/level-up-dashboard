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
import { playSFX, SOUNDS } from '@/lib/sound-manager';
import { hapticSuccess } from '@/lib/haptics';

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
  const [imageError, setImageError] = useState(false);
  const [showHearts, setShowHearts] = useState(false);

  const getAnimalEmoji = () => {
    switch (animalType) {
      case 'horse':   return '🐴';
      case 'sheep':   return '🐑';
      case 'penguin': return '🐧';
      case 'eagle':   return '🦅';
      default:        return '🐾';
    }
  };

  const handleInteract = async () => {
    setIsInteracting(true);
    setShowHearts(true);
    hapticSuccess();
    playSFX(SOUNDS.PET_FEED);

    try {
      await onInteract();
      setTimeout(() => {
        setIsInteracting(false);
        setShowHearts(false);
        onClose();
      }, 700);
    } catch (error) {
      logger.error('Animal interaction failed:', error);
      setIsInteracting(false);
      setShowHearts(false);
    }
  };

  const handleFeed = (foodId: string) => {
    setShowHearts(true);
    hapticSuccess();
    playSFX(SOUNDS.PET_FEED);
    onFeed(foodId);
    setTimeout(() => {
      setShowHearts(false);
      onClose();
    }, 700);
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
        return "A fluffy sheep looks up at you with curious, gentle eyes. Its wool is thick and pristine - a valuable find for any traveler.";
      case 'penguin':
        return "An adorable penguin waddles across the ice with comical determination. It seems friendly and eager to play!";
      case 'eagle':
        return "A majestic eagle perches proudly on a crag. Its keen eyes watch the horizon, radiating grace and untamed authority.";
      default:
        return "A gentle creature of the wilds watches you calmly, welcoming your peaceful presence.";
    }
  };

  const getActionButtonText = () => {
    switch (animalType) {
      case 'horse':   return "Mount & bond";
      case 'sheep':   return "Shear wool";
      case 'penguin': return "Befriend & slide";
      case 'eagle':   return "Beckon to arm";
      default:        return "Pet & bond";
    }
  };

  const getBiomeStyle = () => {
    switch (animalType) {
      case 'penguin':
        return {
          gradient: 'from-cyan-950/90 via-slate-950 to-zinc-950',
          border: 'border-cyan-500/30',
          shadow: 'shadow-cyan-500/10',
          accent: 'text-cyan-400',
          accentBg: 'bg-cyan-900/30',
          button: 'bg-cyan-600 hover:bg-cyan-500'
        };
      case 'sheep':
        return {
          gradient: 'from-emerald-950/90 via-zinc-950 to-zinc-950',
          border: 'border-emerald-500/30',
          shadow: 'shadow-emerald-500/10',
          accent: 'text-emerald-400',
          accentBg: 'bg-emerald-900/30',
          button: 'bg-emerald-600 hover:bg-emerald-500'
        };
      case 'horse':
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
          "w-[min(90vw,400px)] max-w-none p-0 overflow-hidden shadow-2xl rounded-2xl",
          `bg-gradient-to-b ${style.gradient} ${style.border} ${style.shadow}`
        )}
        role="dialog"
        aria-label="animal-interaction-modal"
      >
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
            {/* Floating Heart Particles Overlay */}
            {showHearts && (
              <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
                <span className="absolute -top-6 text-2xl animate-bounce" style={{ animationDuration: '0.6s' }}>❤️</span>
                <span className="absolute -top-3 -right-6 text-xl animate-pulse text-amber-300">✨</span>
                <span className="absolute -top-2 -left-6 text-xl animate-pulse text-pink-400">💕</span>
              </div>
            )}

            <div className={cn("absolute inset-0 rounded-full blur-3xl animate-pulse scale-150 opacity-20", style.accentBg)} />
            <div
              className={cn("absolute -inset-4 border border-dashed rounded-full opacity-30", style.accent)}
              style={{ animation: 'spin 15s linear infinite' }}
            />
            <div className={cn("relative w-40 h-40 rounded-full border-4 shadow-2xl overflow-hidden p-1 bg-zinc-900 group-hover:scale-105 transition-transform duration-500", style.border)}>
              <div className="relative w-full h-full rounded-full overflow-hidden border border-white/10 flex items-center justify-center">
                {imageError ? (
                  <span className="text-7xl select-none" role="img" aria-label={animalName}>
                    {getAnimalEmoji()}
                  </span>
                ) : (
                  <Image
                    src={getAnimalImage()}
                    alt={animalName}
                    fill
                    className="object-cover"
                    priority
                    onError={() => setImageError(true)}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-40 pointer-events-none" />
              </div>
            </div>
            <Sparkles className={cn("absolute -top-3 -right-3 w-5 h-5 animate-pulse opacity-60", style.accent)} />
            <Wind className={cn("absolute -bottom-2 -left-3 w-5 h-5 animate-pulse opacity-40", style.accent)} style={{ animationDelay: '0.5s' }} />
          </div>

          <h2 className={cn("mt-6 text-2xl font-serif font-semibold text-center", style.accent)}>
            {animalName}
          </h2>
          <p className="mt-2 text-zinc-300/80 text-sm leading-relaxed text-center">
            {getAnimalDescription()}
          </p>
        </div>

        {/* Action buttons */}
        <div className="relative z-10 flex flex-col gap-2 px-6 pb-6">
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

          {firstFood && foodLabel && (
            <Button
              onClick={() => handleFeed(firstFood.id)}
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

          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full h-10 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 rounded-xl"
          >
            Leave alone
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
