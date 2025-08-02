"use client"

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { EasterEggManager, EasterEgg } from '@/lib/easter-egg-manager';
import { useUser } from '@clerk/nextjs';
import { gainGold } from '@/lib/gold-manager';
import { toast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trophy, Egg } from 'lucide-react';

interface EasterEggProps {
  egg: EasterEgg;
  onFound: (progress: any) => void;
}

export function EasterEggComponent({ egg, onFound }: EasterEggProps) {
  const { user } = useUser();
  const [isFound, setIsFound] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [progress, setProgress] = useState<any>(null);

  const handleEggClick = async () => {
    if (!user?.id || isFound) return;

    try {
      const manager = EasterEggManager.getInstance();
      const progress = await manager.findEgg(user.id, egg.eggId);
      
      if (progress) {
        // Award 100 gold
        gainGold(100, 'easter-egg');
        
        // Show success toast
        toast({
          title: "🥚 Easter Egg Found!",
          description: `You found an egg and earned 100 gold! ${progress.remainingEggs} eggs remaining.`,
        });

        setIsFound(true);
        setProgress(progress);
        setShowModal(true);
        onFound(progress);
      }
    } catch (error) {
      console.error('[EasterEgg] Error finding egg:', error);
      toast({
        title: "Error",
        description: "Failed to collect Easter egg. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isFound) return null;

  return (
    <>
      <div
        className="fixed z-50 cursor-pointer transition-all duration-300 hover:scale-110 animate-bounce"
        style={{
          left: `${egg.position.x}%`,
          top: `${egg.position.y}%`,
        }}
        onClick={handleEggClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleEggClick();
          }
        }}
        tabIndex={0}
        role="button"
        aria-label="Easter egg - click to collect"
      >
        <div className="relative">
          <Image
            src="/images/egg.png"
            alt="Easter egg"
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
              <Egg className="h-5 w-5" />
              Easter Egg Hunt Progress
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-400 mb-2">
                🥚 Egg Found!
              </div>
              <p className="text-gray-300 mb-4">
                You found an Easter egg and earned 100 gold!
              </p>
            </div>

            {progress && (
              <div className="bg-gray-900/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-300">Progress:</span>
                  <span className="text-sm font-medium text-amber-400">
                    {progress.foundEggs} / {progress.totalEggs}
                  </span>
                </div>
                
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-amber-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(progress.foundEggs / progress.totalEggs) * 100}%` }}
                  />
                </div>
                
                <div className="mt-2 text-center">
                  <span className="text-sm text-gray-400">
                    {progress.remainingEggs} eggs remaining
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