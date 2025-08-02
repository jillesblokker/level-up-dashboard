"use client"

import { useEasterEggs } from '@/hooks/use-easter-eggs';

export function EasterEggWrapper() {
  const { renderEggs } = useEasterEggs();

  return <>{renderEggs()}</>;
} 