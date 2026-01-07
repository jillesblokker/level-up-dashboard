'use client';

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
}

export function AnimalInteractionModal({
  isOpen,
  onClose,
  animalType,
  animalName,
  onInteract,
}: AnimalInteractionModalProps) {
  const [isInteracting, setIsInteracting] = useState(false);

  const handleInteract = async () => {
    setIsInteracting(true);
    try {
      await onInteract();
      onClose();
    } catch (error) {
      console.error('Animal interaction failed:', error);
    } finally {
      setIsInteracting(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const getAnimalImage = (): string => {
    // Use specific horse images from the horse folder
    if (animalType === 'horse') {
      const horseImages: string[] = [
        '/images/items/horse/horse-stelony.png',
        '/images/items/horse/horse-perony.png',
        '/images/items/horse/horse-felony.png'
      ];
      // Randomly select one of the horse images
      const randomIndex = Math.floor(Math.random() * horseImages.length);
      return horseImages[randomIndex]!; // Use non-null assertion since we know the array has elements
    }
    return `/images/Animals/${animalType}.png`;
  };

  const getAnimalDescription = () => {
    switch (animalType) {
      case 'horse':
        return "A magnificent wild horse grazes nearby. Its coat shimmers in the sunlight, and there's a spark of untamed spirit in its eyes. Perhaps with patience, it could become a loyal companion.";
      case 'sheep':
        return "A fluffy sheep looks up at you with curious, gentle eyes. Its wool is thick and pristine—a valuable find for any traveler.";
      case 'penguin':
        return "An adorable penguin waddles across the ice with comical determination. It seems friendly and eager to play!";
      case 'eagle':
        return "A majestic eagle surveys its domain from above. Its piercing gaze suggests ancient wisdom. If you could earn its trust...";
      default:
        return "You've encountered a wild creature!";
    }
  };

  const getActionButtonText = () => {
    switch (animalType) {
      case 'horse':
        return "Attempt to Tame";
      case 'sheep':
        return "Pet the Sheep";
      case 'penguin':
        return "Play with Penguin";
      case 'eagle':
        return "Call the Eagle";
      default:
        return "Interact";
    }
  };

  // Get biome-specific styling
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          "sm:max-w-md overflow-hidden shadow-2xl",
          `bg-gradient-to-b ${style.gradient} ${style.border} ${style.shadow}`
        )}
        role="dialog"
        aria-label="animal-interaction-modal"
      >
        {/* Background Glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className={cn("absolute top-1/4 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl opacity-20", style.accentBg)} />
        </div>

        <DialogHeader className="relative z-10 sr-only">
          <DialogDescription id="animal-interaction-modal-desc">Wild animal encounter</DialogDescription>
        </DialogHeader>

        {/* Animal Display */}
        <div className="relative z-10 flex flex-col items-center py-4">
          {/* Glow Ring */}
          <div className="relative">
            <div className={cn("absolute inset-0 rounded-full blur-2xl animate-pulse scale-110 opacity-30", style.accentBg)} />

            <div className={cn(
              "relative w-40 h-40 rounded-full border p-4 shadow-xl",
              style.border,
              style.accentBg
            )}>
              <Image
                src={getAnimalImage()}
                alt={`${animalName} animal`}
                fill
                className="object-contain p-4 drop-shadow-lg"
                priority
              />
            </div>
          </div>

          {/* Sparkle decorations */}
          <div className="absolute top-8 right-12">
            <Sparkles className={cn("w-4 h-4 animate-pulse opacity-50", style.accent)} />
          </div>
          <div className="absolute bottom-16 left-10">
            <Wind className={cn("w-5 h-5 animate-pulse opacity-40", style.accent)} style={{ animationDelay: '0.5s' }} />
          </div>
        </div>

        {/* Title and description */}
        <div className="relative z-10 text-center px-2">
          <DialogTitle className={cn("text-2xl font-serif mb-2", style.accent)}>
            {animalName}
          </DialogTitle>
          <DialogDescription className="text-zinc-300/80 text-sm leading-relaxed">
            {getAnimalDescription()}
          </DialogDescription>
        </div>

        {/* Action buttons */}
        <DialogFooter className="relative z-10 flex flex-row gap-3 mt-4">
          <Button
            variant="ghost"
            onClick={handleCancel}
            className="flex-1 h-12 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 rounded-xl"
          >
            Leave Alone
          </Button>
          <Button
            onClick={handleInteract}
            disabled={isInteracting}
            className={cn(
              "flex-1 h-12 text-white shadow-lg gap-2 rounded-xl",
              style.button,
              isInteracting && "opacity-70"
            )}
          >
            {isInteracting ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                Approaching...
              </>
            ) : (
              <>
                <Heart className="w-4 h-4" />
                {getActionButtonText()}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
