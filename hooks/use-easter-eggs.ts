"use client"

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import { EasterEggManager, EasterEgg, EasterEggProgress } from '@/lib/easter-egg-manager';

export function useEasterEggs() {
  const { user } = useUser();
  const pathname = usePathname();
  const [eggs, setEggs] = useState<EasterEgg[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState<EasterEggProgress | null>(null);

  useEffect(() => {
    if (!user?.id || !pathname) return;

    const initializeEggs = async () => {
      try {
        setIsLoading(true);
        const manager = EasterEggManager.getInstance();
        await manager.initialize(user.id);
        
        // Get eggs for current page
        const pageEggs = manager.getEggsForPage(pathname);
        setEggs(pageEggs);
        
        // Get overall progress
        const overallProgress = manager.getProgress();
        setProgress(overallProgress);
        
        console.log(`[useEasterEggs] Loaded ${pageEggs.length} eggs for page ${pathname}`);
      } catch (error) {
        console.error('[useEasterEggs] Error initializing eggs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeEggs();
  }, [user?.id, pathname]);

  const handleEggFound = (newProgress: EasterEggProgress) => {
    setProgress(newProgress);
    // Remove the found egg from the list
    setEggs(prev => prev.filter(egg => egg.found === false));
  };

  return {
    eggs,
    progress,
    isLoading,
    handleEggFound,
  };
} 