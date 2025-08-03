"use client"

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import { SeasonalHuntManager, SeasonalItem, SeasonalProgress } from '@/lib/seasonal-hunt-manager';

export function useSeasonalHunt() {
  const { user } = useUser();
  const pathname = usePathname();
  const [items, setItems] = useState<SeasonalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState<SeasonalProgress | null>(null);

  useEffect(() => {
    if (!user?.id || !pathname) return;

    const initializeItems = async () => {
      try {
        setIsLoading(true);
        await SeasonalHuntManager.initialize(user.id);
        
        // Only show items if there's an active event
        if (SeasonalHuntManager.isActiveEvent()) {
          // Get items for current page
          const pageItems = SeasonalHuntManager.getItemsForPage(pathname);
          setItems(pageItems);
          
          // Get overall progress
          const overallProgress = SeasonalHuntManager.getProgress();
          setProgress(overallProgress);
        } else {
          setItems([]);
          setProgress(null);
        }
      } catch (error) {
        setItems([]);
        setProgress(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeItems();
  }, [user?.id, pathname]);

  const handleItemFound = (newProgress: SeasonalProgress) => {
    setProgress(newProgress);
    // Remove the found item from the list
    setItems(prev => prev.filter(item => item.found === false));
  };

  return {
    items,
    progress,
    isLoading,
    handleItemFound,
  };
} 