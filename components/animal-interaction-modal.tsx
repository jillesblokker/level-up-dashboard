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

  const getAnimalImage = () => {
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-amber-800" role="dialog" aria-label="animal-interaction-modal">
        <DialogDescription id="animal-interaction-modal-desc">Wild animal encounter</DialogDescription>

        {/* Animal image */}
        <div className="mb-3 flex justify-center">
          <Image
            src={getAnimalImage()}
            alt={`${animalName} animal`}
            width={120}
            height={120}
            className="w-32 h-32 object-contain rounded-lg"
            priority
          />
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