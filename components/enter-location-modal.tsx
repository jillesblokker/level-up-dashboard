'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface EnterLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationType: 'city' | 'town';
  locationName: string;
}

export function EnterLocationModal({
  isOpen,
  onClose,
  locationType,
  locationName,
}: EnterLocationModalProps) {
  const router = useRouter();

  const handleEnter = () => {
    const route = locationType === 'city' ? '/city' : '/town';
    router.push(`${route}/${locationName}`);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-amber-800" role="dialog" aria-label="enter-location-modal">
        <DialogDescription id="enter-location-modal-desc">Enter a new location</DialogDescription>
        <DialogHeader>
          <DialogTitle className="text-amber-400">
            Enter {locationType.charAt(0).toUpperCase() + locationType.slice(1)}
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            You are about to enter {locationName}. Are you sure you want to proceed?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="border-amber-800 text-amber-400 hover:bg-amber-800/20"
          >
            Cancel
          </Button>
          <Button
            onClick={handleEnter}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            Enter {locationType.charAt(0).toUpperCase() + locationType.slice(1)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
