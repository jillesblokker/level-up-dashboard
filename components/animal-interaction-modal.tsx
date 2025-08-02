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
        return "You've found a wild horse! This majestic creature could be a valuable companion on your journey.";
      case 'sheep':
        return "A fluffy sheep grazes peacefully. It seems friendly and approachable.";
      case 'penguin':
        return "A curious penguin waddles around the ice. It looks like it wants to play!";
      case 'eagle':
        return "A majestic eagle soars overhead. Its keen eyes seem to be watching you.";
      default:
        return "You've encountered a wild animal!";
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

  // Determine modal size based on content
  const getModalSize = () => {
    const description = getAnimalDescription();
    if (description.length > 200) return "sm:max-w-lg";
    if (description.length > 100) return "sm:max-w-md";
    return "sm:max-w-sm";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${getModalSize()} bg-gray-900 border-amber-800`} role="dialog" aria-label="animal-interaction-modal">
        <DialogDescription id="animal-interaction-modal-desc">Wild animal encounter</DialogDescription>

        {/* Animal image */}
        <div className="mb-4 flex justify-center">
          <div className="relative w-40 h-40 bg-gradient-to-br from-amber-900/20 to-amber-800/10 rounded-xl border border-amber-800/30 p-4">
            <Image
              src={getAnimalImage()}
              alt={`${animalName} animal`}
              fill
              className="object-contain rounded-lg"
              priority
            />
          </div>
        </div>

        {/* Title and description */}
        <div className="mb-4">
          <DialogTitle className="text-amber-400 text-xl font-bold mb-1">
            {animalName}
          </DialogTitle>
          <DialogDescription className="text-gray-300 text-sm">
            {getAnimalDescription()}
          </DialogDescription>
        </div>

        {/* Action buttons */}
        <DialogFooter className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="border-amber-800 text-amber-400 hover:bg-amber-800/20"
          >
            Leave Alone
          </Button>
          <Button
            onClick={handleInteract}
            disabled={isInteracting}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isInteracting ? 'Interacting...' : getActionButtonText()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 