"use client"

import { useState } from 'react';
import Image from 'next/image';
import { SeasonalHuntManager, SeasonalItem, SeasonalProgress, SEASONAL_EVENTS } from '@/lib/seasonal-hunt-manager';
import { useUser } from '@clerk/nextjs';
import { gainGold } from '@/lib/gold-manager';
import { toast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Gift, Egg, Circle } from 'lucide-react';

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

  const handleItemClick = async () => {
    if (!user?.id || isFound || !eventConfig) return;

    try {
      const foundItem = await SeasonalHuntManager.findItem(user.id, item.item_id);
      
      if (foundItem) {
        // Award gold based on event
        gainGold(eventConfig.goldReward, 'seasonal-hunt');
        
        // Get updated progress
        const currentProgress = SeasonalHuntManager.getProgress();
        
        // Show success toast
        toast({
          title: `🎉 ${eventConfig.name}!`,
          description: `You found a ${currentEvent === 'easter' ? 'egg' : currentEvent === 'christmas' ? 'present' : 'pumpkin'} and earned ${eventConfig.goldReward} gold! ${currentProgress.remaining} remaining.`,
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
      case 'easter': return <Egg className="h-5 w-5" />;
      case 'christmas': return <Gift className="h-5 w-5" />;
      case 'halloween': return <Circle className="h-5 w-5" />;
      default: return <Gift className="h-5 w-5" />;
    }
  };

  return (
    <>
      <div
        className="fixed z-50 cursor-pointer transition-all duration-300 hover:scale-110 animate-bounce"
        style={{
          left: `${item.position.x}px`,
          top: `${item.position.y}px`,
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
        <div className="relative">
          <Image
            src={eventConfig.image}
            alt={eventConfig.name}
            width={40}
            height={40}
            className="drop-shadow-lg"
          />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
        </div>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-black border border-amber-800/20 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-400">
              {getIcon()}
              {eventConfig.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-400 mb-2">
                🎉 Item Found!
              </div>
              <p className="text-gray-300 mb-4">
                You found a {currentEvent === 'easter' ? 'egg' : currentEvent === 'christmas' ? 'present' : 'pumpkin'} and earned {eventConfig.goldReward} gold!
              </p>
            </div>

            {progress && (
              <div className="bg-gray-900/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-300">Progress:</span>
                  <span className="text-sm font-medium text-amber-400">
                    {progress.found} / {progress.total}
                  </span>
                </div>
                
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-amber-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(progress.found / progress.total) * 100}%` }}
                  />
                </div>
                
                <div className="mt-2 text-center">
                  <span className="text-sm text-gray-400">
                    {progress.remaining} items remaining
                  </span>
                </div>
              </div>
            )}

            <div className="flex justify-center">
              <Button 
                onClick={() => setShowModal(false)}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                Continue Hunting
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 