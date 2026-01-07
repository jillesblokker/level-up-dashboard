'use client';

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
import { MapPin, ArrowRight, Building, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  // Dynamic flavor text based on location
  const getFlavorText = () => {
    if (locationType === 'city') {
      return `The towering gates of ${locationName} stand before you. Within these walls, merchants hawk their wares, blacksmiths forge legendary equipment, and tales of adventure await at every corner.`;
    }
    return `The quaint village of ${locationName} welcomes weary travelers. A peaceful tavern, friendly locals, and the promise of rest call to you.`;
  };

  const displayName = locationName && locationName !== 'unknown' ? locationName : 'this location';
  const buttonText = locationType === 'city' ? 'Enter City' : 'Enter Town';
  const LocationIcon = locationType === 'city' ? Building : Home;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-md bg-gradient-to-b from-amber-950/90 via-zinc-950 to-zinc-950 border-amber-700/30 shadow-2xl shadow-amber-500/10 overflow-hidden p-0"
        role="dialog"
        aria-label="enter-location-modal"
      >
        {/* Hero Image */}
        <div className="relative w-full h-40 overflow-hidden">
          <Image
            src="/images/citywall.png"
            alt="Medieval city wall and gate"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent" />

          {/* Location Badge */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-amber-900/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-amber-600/30">
            <LocationIcon className="w-4 h-4 text-amber-300" />
            <span className="text-sm font-medium text-amber-100 capitalize">{locationType}</span>
          </div>
        </div>

        <div className="p-6 pt-2">
          <DialogHeader className="text-left">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-5 h-5 text-amber-400" />
              <DialogTitle className="text-2xl font-serif text-amber-200">
                {displayName}
              </DialogTitle>
            </div>
            <DialogDescription className="text-amber-100/70 text-sm leading-relaxed">
              {getFlavorText()}
            </DialogDescription>
          </DialogHeader>

          {/* What you can do */}
          <div className="mt-4 p-3 bg-zinc-900/50 rounded-lg border border-amber-800/20">
            <p className="text-xs text-amber-300/60 uppercase tracking-wide mb-2">Available Activities</p>
            <div className="flex flex-wrap gap-2">
              {locationType === 'city' ? (
                <>
                  <span className="text-xs bg-amber-900/30 text-amber-200/80 px-2 py-1 rounded">🛒 Shop</span>
                  <span className="text-xs bg-amber-900/30 text-amber-200/80 px-2 py-1 rounded">🏰 Castle</span>
                  <span className="text-xs bg-amber-900/30 text-amber-200/80 px-2 py-1 rounded">🍺 Tavern</span>
                  <span className="text-xs bg-amber-900/30 text-amber-200/80 px-2 py-1 rounded">⛪ Temple</span>
                </>
              ) : (
                <>
                  <span className="text-xs bg-amber-900/30 text-amber-200/80 px-2 py-1 rounded">🍺 Tavern</span>
                  <span className="text-xs bg-amber-900/30 text-amber-200/80 px-2 py-1 rounded">🏪 Market</span>
                  <span className="text-xs bg-amber-900/30 text-amber-200/80 px-2 py-1 rounded">💤 Rest</span>
                </>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <DialogFooter className="relative z-10 flex flex-row gap-3 mt-6">
            <Button
              variant="ghost"
              onClick={handleCancel}
              className="flex-1 h-12 text-amber-200/60 hover:text-amber-100 hover:bg-amber-900/20 rounded-xl"
            >
              Not Yet
            </Button>
            <Button
              onClick={handleEnter}
              className="flex-1 h-12 bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-500/20 gap-2 rounded-xl"
            >
              {buttonText}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

