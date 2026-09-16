"use client";

import React, { useEffect } from "react";
import { playSFX, SOUNDS } from "@/lib/sound-manager";
import confetti from "canvas-confetti";
import { Sparkles, Trophy } from "lucide-react";

interface HeraldTrumpetsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
}

export const HeraldTrumpetsOverlay: React.FC<HeraldTrumpetsOverlayProps> = ({
  isOpen,
  onClose,
  title = "Royal Triumph!",
  subtitle = "Habit milestone conquered with honor!"
}) => {
  useEffect(() => {
    if (!isOpen) return;

    // Play herald brass fanfare
    playSFX(SOUNDS.HERALD_FANFARE);

    // Fire dual golden confetti cannons from bottom corners
    confetti({
      particleCount: 60,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.8 },
      colors: ["#f59e0b", "#fbbf24", "#10b981", "#ffffff"]
    });
    confetti({
      particleCount: 60,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.8 },
      colors: ["#f59e0b", "#fbbf24", "#10b981", "#ffffff"]
    });

    const timer = setTimeout(() => {
      onClose();
    }, 3200);

    return () => clearTimeout(timer);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] pointer-events-auto flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300 select-none cursor-pointer"
    >
      <div className="relative w-full max-w-lg mx-4 flex flex-col items-center">
        {/* Left Trumpet Banner */}
        <div className="absolute -left-4 sm:-left-12 top-1/2 -translate-y-1/2 flex items-center animate-in slide-in-from-left-20 duration-500">
          <div className="flex flex-col items-center">
            <span className="text-4xl sm:text-6xl drop-shadow-[0_8px_16px_rgba(245,158,11,0.6)] transform -rotate-12">
              🎺
            </span>
            <div className="w-8 sm:w-12 h-10 sm:h-14 bg-gradient-to-b from-amber-600 to-amber-900 border border-amber-400/50 rounded-b-md shadow-md flex items-center justify-center text-[10px] sm:text-xs font-serif font-bold text-amber-200">
              ⚜️
            </div>
          </div>
        </div>

        {/* Right Trumpet Banner */}
        <div className="absolute -right-4 sm:-right-12 top-1/2 -translate-y-1/2 flex items-center animate-in slide-in-from-right-20 duration-500">
          <div className="flex flex-col items-center">
            <span className="text-4xl sm:text-6xl drop-shadow-[0_8px_16px_rgba(245,158,11,0.6)] transform rotate-12 scale-x-[-1]">
              🎺
            </span>
            <div className="w-8 sm:w-12 h-10 sm:h-14 bg-gradient-to-b from-amber-600 to-amber-900 border border-amber-400/50 rounded-b-md shadow-md flex items-center justify-center text-[10px] sm:text-xs font-serif font-bold text-amber-200">
              ⚜️
            </div>
          </div>
        </div>

        {/* Center Royal Plaque */}
        <div className="bg-gradient-to-b from-zinc-900 via-zinc-950 to-zinc-900 border-2 border-amber-500/60 rounded-2xl p-6 sm:p-8 shadow-[0_0_50px_rgba(245,158,11,0.4)] flex flex-col items-center text-center animate-in zoom-in-90 duration-400 max-w-sm sm:max-w-md w-full relative overflow-hidden">
          {/* Subtle gold glow pulse */}
          <div className="absolute inset-0 bg-amber-500/5 animate-pulse pointer-events-none" />

          {/* Trophy Badge */}
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-400 p-0.5 shadow-lg shadow-amber-500/30 mb-3 flex items-center justify-center">
            <div className="w-full h-full bg-zinc-950 rounded-full flex items-center justify-center">
              <Trophy className="w-7 h-7 text-amber-400 animate-bounce" />
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-amber-400 font-serif font-bold text-xs uppercase tracking-widest mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Praise & honor</span>
            <Sparkles className="w-3.5 h-3.5" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-serif font-extrabold text-amber-100 tracking-tight mb-2 drop-shadow-md">
            {title}
          </h2>

          <p className="text-xs sm:text-sm text-zinc-300 font-medium max-w-xs leading-relaxed">
            {subtitle}
          </p>

          <div className="mt-4 text-[10px] text-zinc-500 font-mono">
            Tap anywhere to dismiss
          </div>
        </div>
      </div>
    </div>
  );
};
