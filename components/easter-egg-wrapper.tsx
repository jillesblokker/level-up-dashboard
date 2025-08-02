"use client"

import { useEasterEggs } from '@/hooks/use-easter-eggs';
import { EasterEggComponent } from '@/components/easter-egg';

export function EasterEggWrapper() {
  const { eggs, isLoading, handleEggFound } = useEasterEggs();

  if (isLoading) return null;

  return (
    <>
      {eggs.map((egg) => (
        <EasterEggComponent
          key={egg.eggId}
          egg={egg}
          onFound={handleEggFound}
        />
      ))}
    </>
  );
} 