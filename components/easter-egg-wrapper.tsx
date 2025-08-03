"use client"

import { useSeasonalHunt } from '@/hooks/use-seasonal-hunt';
import { SeasonalHuntItem } from '@/components/easter-egg';

export function SeasonalHuntWrapper() {
  const { items, isLoading, handleItemFound } = useSeasonalHunt();

  if (isLoading) return null;

  return (
    <>
      {items.map((item) => (
        <SeasonalHuntItem
          key={item.item_id}
          item={item}
          onFound={handleItemFound}
        />
      ))}
    </>
  );
} 