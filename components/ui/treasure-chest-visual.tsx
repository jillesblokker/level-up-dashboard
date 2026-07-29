"use client"

import React from 'react'
import { cn } from '@/lib/utils'
import { Sparkles, Lock, CheckCircle2 } from 'lucide-react'

interface TreasureChestVisualProps {
  state: 'locked' | 'ready' | 'opening' | 'claimed'
  tierLabel?: string
  tierColor?: string
  className?: string
  onClick?: () => void
}

export function TreasureChestVisual({
  state,
  tierLabel = "Bronze Chest",
  tierColor = "from-amber-700 via-amber-900 to-zinc-950",
  className,
  onClick
}: TreasureChestVisualProps) {
  const isOpening = state === 'opening'
  const isReady = state === 'ready'
  const isClaimed = state === 'claimed'
  const isLocked = state === 'locked'

  return (
    <div
      onClick={isReady ? onClick : undefined}
      className={cn(
        "relative flex flex-col items-center justify-center p-6 rounded-2xl border transition-all duration-500 overflow-hidden group select-none",
        isReady && "cursor-pointer hover:scale-105 border-amber-500/60 bg-gradient-to-b from-amber-950/80 via-zinc-950 to-amber-950/90 shadow-[0_0_30px_rgba(245,158,11,0.25)] hover:shadow-[0_0_40px_rgba(245,158,11,0.4)]",
        isOpening && "border-amber-400 bg-amber-950/90 shadow-[0_0_50px_rgba(245,158,11,0.6)] animate-pulse",
        isClaimed && "border-zinc-800 bg-zinc-950/80 opacity-70 grayscale",
        isLocked && "border-zinc-800/80 bg-zinc-950/90 opacity-80",
        className
      )}
    >
      {/* Background Ambient Rays for Ready/Opening */}
      {(isReady || isOpening) && (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.2),transparent_70%)] animate-pulse pointer-events-none" />
      )}

      {/* SVG Medieval Chest Illustration */}
      <div className="relative w-28 h-24 flex items-center justify-center my-2">
        {/* Sparkle Particle FX */}
        {(isReady || isOpening) && (
          <>
            <Sparkles className="w-5 h-5 text-amber-300 absolute -top-2 -left-2 animate-bounce" />
            <Sparkles className="w-4 h-4 text-amber-400 absolute -top-1 -right-2 animate-ping" />
            <Sparkles className="w-5 h-5 text-amber-200 absolute -bottom-1 -right-3 animate-pulse" />
          </>
        )}

        <svg viewBox="0 0 120 100" className="w-full h-full drop-shadow-[0_10px_15px_rgba(0,0,0,0.8)]">
          <defs>
            {/* Wood Grain Gradient */}
            <linearGradient id="oakWood" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#78350f" />
              <stop offset="50%" stopColor="#451a03" />
              <stop offset="100%" stopColor="#290e02" />
            </linearGradient>

            {/* Gold Trim & Lock Gradient */}
            <linearGradient id="goldPlate" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#b45309" />
              <stop offset="30%" stopColor="#f59e0b" />
              <stop offset="70%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>

            {/* Inner Light Glow */}
            <radialGradient id="chestInnerGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fef08a" stopOpacity="1" />
              <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#b45309" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Chest Base Body */}
          <rect x="15" y="45" width="90" height="45" rx="6" fill="url(#oakWood)" stroke="#18181b" strokeWidth="2" />

          {/* Iron & Gold Reinforcement Straps */}
          <rect x="25" y="45" width="10" height="45" fill="url(#goldPlate)" opacity="0.9" />
          <rect x="85" y="45" width="10" height="45" fill="url(#goldPlate)" opacity="0.9" />

          {/* Corner Rivets */}
          <circle cx="30" cy="50" r="1.5" fill="#fef08a" />
          <circle cx="30" cy="85" r="1.5" fill="#fef08a" />
          <circle cx="90" cy="50" r="1.5" fill="#fef08a" />
          <circle cx="90" cy="85" r="1.5" fill="#fef08a" />

          {/* Inner Treasure Glow when Claimed/Opening */}
          {(isOpening || isClaimed) && (
            <ellipse cx="60" cy="45" rx="35" ry="12" fill="url(#chestInnerGlow)" />
          )}

          {/* Chest Lid (Lifts on Opening/Claimed) */}
          <g
            className={cn(
              "transition-transform duration-700 ease-out origin-[60px_45px]",
              isOpening && "-translate-y-6 rotate-[-15deg]",
              isClaimed && "-translate-y-8 rotate-[-25deg]"
            )}
          >
            {/* Domed Roof */}
            <path
              d="M 12 45 C 12 20 108 20 108 45 Z"
              fill="url(#oakWood)"
              stroke="#18181b"
              strokeWidth="2"
            />
            {/* Lid Gold Bands */}
            <path d="M 25 45 C 25 25 35 25 35 45 Z" fill="url(#goldPlate)" />
            <path d="M 85 45 C 85 25 95 25 95 45 Z" fill="url(#goldPlate)" />
            {/* Rim Trim */}
            <rect x="12" y="41" width="96" height="5" rx="2" fill="url(#goldPlate)" />
          </g>

          {/* Front Lock Plate */}
          <rect x="50" y="40" width="20" height="22" rx="3" fill="url(#goldPlate)" stroke="#451a03" strokeWidth="1.5" />
          {/* Keyhole Slot */}
          <circle cx="60" cy="48" r="3" fill="#18181b" />
          <polygon points="58.5,48 61.5,48 62,56 58,56" fill="#18181b" />
        </svg>
      </div>

      {/* Tier Label Badge */}
      <div className="mt-2 text-center space-y-1 z-10">
        <span className="px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 font-medieval text-xs tracking-wider uppercase shadow-md">
          {tierLabel}
        </span>

        {isClaimed && (
          <div className="flex items-center justify-center gap-1 text-[11px] text-zinc-400 font-bold mt-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Claimed Today
          </div>
        )}

        {isLocked && (
          <div className="flex items-center justify-center gap-1 text-[11px] text-zinc-400 font-bold mt-1">
            <Lock className="w-3.5 h-3.5 text-amber-500" />
            Locked • Check In Required
          </div>
        )}

        {isReady && (
          <div className="text-[11px] text-amber-400 font-bold animate-pulse mt-1">
            Tap to Open Treasure Chest!
          </div>
        )}
      </div>
    </div>
  )
}
