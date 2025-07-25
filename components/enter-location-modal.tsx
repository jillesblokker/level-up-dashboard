'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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

  // Determine the display name - use locationName if available, otherwise fallback
  const displayName = locationName && locationName !== 'unknown' ? locationName : 'Ready to enter';
  const buttonText = locationType === 'city' ? 'Enter City' : 'Enter Town';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-amber-800" role="dialog" aria-label="enter-location-modal">
        <DialogDescription id="enter-location-modal-desc">Welcome stranger</DialogDescription>
        
        {/* Header with welcome text */}
        <div className="mb-3">
          <span className="text-gray-300 text-sm">Welcome stranger</span>
        </div>

        {/* City wall image */}
        <div className="mb-3">
          <Image
            src="/images/citywall.png"
            alt="Medieval city wall and gate"
            width={400}
            height={200}
            className="w-full h-auto rounded-lg"
            priority
          />
        </div>

        {/* Title and description */}
        <div className="mb-4">
          <DialogTitle className="text-amber-400 text-xl font-bold mb-1">
            Enter {displayName}
          </DialogTitle>
          <DialogDescription className="text-gray-300 text-sm">
            You are about to enter. Are you sure you want to proceed?
          </DialogDescription>
        </div>

        {/* Action buttons */}
        <DialogFooter className="flex gap-3">
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
            {buttonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
