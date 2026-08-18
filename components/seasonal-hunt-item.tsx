"use client"

import { useState } from 'react';
import Image from 'next/image';
import { SeasonalHuntManager, SeasonalItem, SeasonalProgress, SEASONAL_EVENTS, SEASONAL_ITEM_POSITIONS, SeasonalHidingSpot } from '@/lib/seasonal-hunt-manager';
import { useUser } from '@clerk/nextjs';
import { gainGold } from '@/lib/gold-manager';
import { toast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Gift, Egg, Circle, Heart, Clover, Shield, Sun, Sparkles, Hammer, Wheat, Scroll } from 'lucide-react';
import { formatCount, pluralize } from '@/lib/utils';

interface SeasonalHuntItemProps {
  item: SeasonalItem;
  onFound: (progress: SeasonalProgress) => void;
}

export function SeasonalHuntItem({ item, onFound }: SeasonalHuntItemProps) {
  const { user } = useUser();
  const [isFound, setIsFound] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [progress, setProgress] = useState<SeasonalProgress | null>(null);

  const currentEvent = SeasonalHuntManager.getCurrentEvent();
  const eventConfig = currentEvent ? SEASONAL_EVENTS[currentEvent] : null;

  const getEventItemName = (eventKey: string | null) => {
    switch (eventKey) {
      case 'easter': return 'egg';
      case 'christmas': return 'present';
      case 'halloween': return 'pumpkin';
      case 'newyear': return 'firework sparkler';
      case 'valentine': return 'heart charm';
      case 'spring': return 'lucky clover';
      case 'shield_joust': return 'shield';
      case 'solstice': return 'sun crest';
      case 'firefly': return 'firefly lantern';
      case 'forge_fire': return 'iron ingot';
      case 'harvest': return 'wheat sheaf';
      case 'remembrance': return 'heritage scroll';
      default: return 'seasonal item';
    }
  };

  // Lookup hiding spot position
  const hidingSpot = SEASONAL_ITEM_POSITIONS.find((pos: SeasonalHidingSpot) => pos.itemId === item.item_id) || {
    itemId: item.item_id,
    page: '/',
    pageName: 'Kingdom',
    locationName: 'Secret Corner',
    clue: 'Hiding near the edge of the realm...',
    style: { bottom: '100px', right: '20px' }
  }

  const handleItemClick = async () => {
    if (!user?.id || isFound || !eventConfig) return;

    try {
      const foundItem = await SeasonalHuntManager.findItem(user.id, item.item_id);
      
      if (foundItem) {
        // Award gold based on event
        gainGold(eventConfig.goldReward, 'seasonal-hunt');
        
        // Get updated progress
        const currentProgress = SeasonalHuntManager.getProgress();
        
        // Dispatch global update event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('seasonal-hunt:updated'))
        }

        // Show success toast
        toast({
          title: `🎉 ${eventConfig.name}!`,
          description: `You found a ${getEventItemName(currentEvent)}! Earned +${eventConfig.goldReward} Gold & +25 Essences. ${formatCount(currentProgress.remaining, 'hidden item')} remaining.`,
        });

        setIsFound(true);
        setProgress(currentProgress);
        setShowModal(true);
        onFound(currentProgress);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to collect item. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isFound || !eventConfig) return null;

  const getIcon = () => {
    switch (currentEvent) {
      case 'easter': return <Egg className="h-5 w-5 text-yellow-400" />;
      case 'christmas': return <Gift className="h-5 w-5 text-red-400" />;
      case 'halloween': return <Circle className="h-5 w-5 text-orange-400" />;
      case 'valentine': return <Heart className="h-5 w-5 text-pink-400" />;
      case 'spring': return <Clover className="h-5 w-5 text-emerald-400" />;
      case 'shield_joust': return <Shield className="h-5 w-5 text-amber-400" />;
      case 'solstice': return <Sun className="h-5 w-5 text-amber-300" />;
      case 'firefly': return <Sparkles className="h-5 w-5 text-amber-400" />;
      case 'forge_fire': return <Hammer className="h-5 w-5 text-orange-300" />;
      case 'harvest': return <Wheat className="h-5 w-5 text-amber-400" />;
      case 'remembrance': return <Scroll className="h-5 w-5 text-yellow-300" />;
      case 'newyear': return <Sparkles className="h-5 w-5 text-amber-400" />;
      default: return <Gift className="h-5 w-5 text-amber-400" />;
    }
  };

  return (
    <>
      <div
        className="fixed z-40 cursor-pointer group select-none transition-transform duration-300 hover:scale-125"
        style={{
          top: hidingSpot.style.top,
          bottom: hidingSpot.style.bottom,
          left: hidingSpot.style.left,
          right: hidingSpot.style.right,
        }}
        onClick={handleItemClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleItemClick();
          }
        }}
        tabIndex={0}
        role="button"
        aria-label={`${eventConfig.name} - click to collect`}
      >
        <div className="relative flex items-center justify-center p-1.5">
          {/* Glowing Aura Sparkle */}
          <div className="absolute inset-0 bg-amber-400/30 rounded-full blur-md group-hover:bg-amber-400/60 transition-all animate-pulse" />
          <Image
            src={eventConfig.image}
            alt={eventConfig.name}
            width={44}
            height={44}
            className="relative z-10 drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] group-hover:rotate-12 transition-transform duration-300"
          />
          {/* Hide & Seek Peeking Badge */}
          <span className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold font-mono text-[9px] px-1.5 py-0.5 rounded-full shadow border border-amber-300/40 animate-bounce">
            Peek!
          </span>
        </div>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-black border border-amber-800/30 text-white max-w-sm rounded-2xl p-6 shadow-2xl" role="dialog" aria-label="seasonal-hunt-item-found">
          <DialogHeader className="text-center space-y-2">
            <DialogTitle className="flex items-center justify-center gap-2 text-xl font-bold text-amber-400 font-serif">
              {getIcon()}
              {eventConfig.name}
            </DialogTitle>
            <p className="text-xs text-zinc-400">
              Seasonal Hide & Seek Discovery!
            </p>
          </DialogHeader>
          
          <div className="space-y-4 pt-2">
            <div className="text-center p-4 rounded-xl bg-zinc-900/90 border border-amber-800/20 space-y-2">
              <div className="text-2xl font-bold text-amber-300 font-serif">
                🎉 Item Collected!
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                You discovered a hidden <span className="font-bold text-amber-400">{getEventItemName(currentEvent)}</span> at {hidingSpot.locationName}!
              </p>

              <div className="flex justify-center gap-3 pt-2 font-mono text-xs">
                <span className="bg-amber-950/80 text-amber-300 px-3 py-1 rounded-lg border border-amber-500/30 font-bold">
                  💰 +{eventConfig.goldReward} Gold
                </span>
                <span className="bg-purple-950/80 text-purple-300 px-3 py-1 rounded-lg border border-purple-500/30 font-bold">
                  🧪 +25 Essences
                </span>
              </div>
            </div>

            {progress && (
              <div className="bg-zinc-900/90 rounded-xl p-3.5 border border-amber-900/20 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Event Progress</span>
                  <span className="font-bold font-mono text-amber-400">
                    {progress.found} / {progress.total} Found
                  </span>
                </div>
                
                <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden border border-amber-900/30">
                  <div 
                    className="bg-gradient-to-r from-amber-500 to-amber-300 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(progress.found / progress.total) * 100}%` }}
                  />
                </div>
                
                <p className="text-[11px] text-center text-zinc-400">
                  {progress.remaining > 0 
                    ? `🔍 ${formatCount(progress.remaining, 'hidden item')} remaining across the kingdom!`
                    : `🏆 Master Hunter! All 10 seasonal items collected!`}
                </p>
              </div>
            )}

            <div className="flex justify-center pt-1">
              <Button 
                onClick={() => setShowModal(false)}
                className="bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-white font-bold px-6 py-2 rounded-xl text-xs"
              >
                Continue Hide & Seek Hunt
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 