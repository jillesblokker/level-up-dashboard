"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  isPlacementCollected,
  collectRune,
  RUNE_COLLECTED_EVENT,
} from '@/lib/runes-service';
import { hapticLight, hapticMedium, hapticSuccess } from '@/lib/haptics';
import { playSFX } from '@/lib/sound-manager';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface CollectibleRuneProps {
  id: string; // unique placement identifier, e.g. "raidho_momentum"
  runeId: string; // rune identifier, e.g. "raidho"
  symbol: string; // e.g. "ᚱ"
  name: string; // e.g. "Raidho"
  meaning: string; // e.g. "Journey, rhythm & momentum"
  className?: string;
}

export function CollectibleRune({
  id,
  runeId,
  symbol,
  name,
  meaning,
  className,
}: CollectibleRuneProps) {
  const [collected, setCollected] = useState<boolean>(true); // start true during SSR to avoid flash
  const [clicks, setClicks] = useState<number>(0);
  const [isDissolving, setIsDissolving] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check local collected state on mount
    setCollected(isPlacementCollected(id));

    const handleRuneEvent = () => {
      setCollected(isPlacementCollected(id));
    };

    window.addEventListener(RUNE_COLLECTED_EVENT, handleRuneEvent);
    return () => {
      window.removeEventListener(RUNE_COLLECTED_EVENT, handleRuneEvent);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [id]);

  if (collected && !isDissolving) {
    return null;
  }

  const handleClick = async (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (isDissolving) return;

    // Reset click timer
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setClicks(0);
    }, 3500);

    const nextClicks = clicks + 1;

    if (nextClicks === 1) {
      setClicks(1);
      hapticLight();
    } else if (nextClicks === 2) {
      setClicks(2);
      hapticMedium();
    } else if (nextClicks >= 3) {
      // 3rd click: Collected!
      setClicks(3);
      setIsDissolving(true);
      hapticSuccess();
      playSFX('achievement');

      const res = await collectRune(id, runeId);

      if (res.isFirstRune) {
        toast({
          title: `Ancient resonance awakened: ${symbol} ${name}`,
          description: `The whisper of an Elder Rune stirs within your soul. Seek the Codex under Achievements.`,
        });
      } else if (res.unlockedRunesCount === res.totalRunes) {
        toast({
          title: `✦ Elder Runic Master! ✦`,
          description: `All ${res.totalRunes} sacred Elder Runes have answered your call!`,
        });
      } else {
        toast({
          title: `Rune awakened: ${symbol} ${name}`,
          description: `${meaning}. Bound to your codex (${res.unlockedRunesCount}/${res.totalRunes}).`,
        });
      }

      setTimeout(() => {
        setCollected(true);
        setIsDissolving(false);
      }, 450);
    }
  };

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onTouchStart={handleClick}
      title={`${symbol} (${name}): ${meaning}`}
      className={cn(
        'cursor-pointer select-none font-mono transition-all duration-300 inline-flex items-center justify-center',
        clicks === 0 && 'text-amber-500/80 hover:text-amber-300 hover:scale-110 active:scale-95',
        clicks === 1 && 'text-amber-300 scale-125 animate-pulse drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]',
        clicks === 2 && 'text-amber-200 scale-150 animate-bounce drop-shadow-[0_0_12px_rgba(251,191,36,1)]',
        isDissolving && 'scale-200 opacity-0 -translate-y-2 blur-[1px]',
        className
      )}
    >
      {symbol}
    </span>
  );
}
