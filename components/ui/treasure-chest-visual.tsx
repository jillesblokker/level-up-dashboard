"use client"

import React, { useId } from 'react'
import { cn } from '@/lib/utils'
import { Sparkles, Lock, CheckCircle2 } from 'lucide-react'

export type ChestRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

interface TreasureChestVisualProps {
  state: 'locked' | 'ready' | 'opening' | 'claimed'
  rarity?: ChestRarity
  tierLabel?: string
  tierColor?: string
  className?: string
  onClick?: () => void
  hideLabels?: boolean
}

interface RarityTheme {
  name: string
  bodyGradient: [string, string, string] // start, mid, end
  trimGradient: [string, string, string, string] // dark, mid, light, highlight
  innerGlow: [string, string, string]
  rivetColor: string
  hasSideRings: boolean
  hasGemCrest: boolean
  hasLidGems: boolean
  gemColors?: [string, string]
  containerBgReady: string
  containerBorderReady: string
  containerShadowReady: string
  rayGlow: string
  badgeBg: string
  badgeText: string
  badgeBorder: string
  sparkleColor: string
}

const RARITY_THEMES: Record<ChestRarity, RarityTheme> = {
  // 1. Common: Weathered Oak & Rugged Iron
  common: {
    name: 'Common',
    bodyGradient: ['#78350f', '#451a03', '#290e02'],
    trimGradient: ['#3f3f46', '#71717a', '#a1a1aa', '#52525b'],
    innerGlow: ['#fef08a', '#f59e0b', '#b45309'],
    rivetColor: '#d4d4d8',
    hasSideRings: false,
    hasGemCrest: false,
    hasLidGems: false,
    containerBgReady: 'bg-gradient-to-b from-amber-950/60 via-zinc-950 to-zinc-950',
    containerBorderReady: 'border-amber-700/60 hover:border-amber-500',
    containerShadowReady: 'shadow-[0_0_25px_rgba(180,83,9,0.25)] hover:shadow-[0_0_35px_rgba(245,158,11,0.35)]',
    rayGlow: 'rgba(245,158,11,0.15)',
    badgeBg: 'bg-amber-950/80',
    badgeText: 'text-amber-300',
    badgeBorder: 'border-amber-700/50',
    sparkleColor: 'text-amber-300',
  },

  // 2. Uncommon: Verdant Emerald & Antique Gold (Matches left chest in screenshot)
  uncommon: {
    name: 'Uncommon',
    bodyGradient: ['#065f46', '#047857', '#022c22'],
    trimGradient: ['#b45309', '#f59e0b', '#fbbf24', '#fef08a'],
    innerGlow: ['#a7f3d0', '#10b981', '#047857'],
    rivetColor: '#fef08a',
    hasSideRings: false,
    hasGemCrest: false,
    hasLidGems: false,
    containerBgReady: 'bg-gradient-to-b from-emerald-950/70 via-zinc-950 to-zinc-950',
    containerBorderReady: 'border-emerald-500/60 hover:border-emerald-400',
    containerShadowReady: 'shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_45px_rgba(16,185,129,0.45)]',
    rayGlow: 'rgba(16,185,129,0.2)',
    badgeBg: 'bg-emerald-950/80',
    badgeText: 'text-emerald-300',
    badgeBorder: 'border-emerald-500/50',
    sparkleColor: 'text-emerald-300',
  },

  // 3. Rare: Cobalt Sapphire & Polished Steel (Matches right chest in screenshot)
  rare: {
    name: 'Rare',
    bodyGradient: ['#1e40af', '#2563eb', '#0f172a'],
    trimGradient: ['#475569', '#94a3b8', '#cbd5e1', '#f8fafc'],
    innerGlow: ['#bfdbfe', '#3b82f6', '#1d4ed8'],
    rivetColor: '#e2e8f0',
    hasSideRings: false,
    hasGemCrest: false,
    hasLidGems: false,
    containerBgReady: 'bg-gradient-to-b from-blue-950/70 via-zinc-950 to-zinc-950',
    containerBorderReady: 'border-blue-500/60 hover:border-blue-400',
    containerShadowReady: 'shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:shadow-[0_0_45px_rgba(59,130,246,0.45)]',
    rayGlow: 'rgba(59,130,246,0.2)',
    badgeBg: 'bg-blue-950/80',
    badgeText: 'text-blue-300',
    badgeBorder: 'border-blue-500/50',
    sparkleColor: 'text-blue-300',
  },

  // 4. Epic: Royal Amethyst & Opulent Gold with Purple Gemstone Crest (Matches center chest in screenshot)
  epic: {
    name: 'Epic',
    bodyGradient: ['#6b21a8', '#7e22ce', '#3b0764'],
    trimGradient: ['#b45309', '#f59e0b', '#fbbf24', '#fef08a'],
    innerGlow: ['#f3e8ff', '#a855f7', '#6b21a8'],
    rivetColor: '#fef08a',
    hasSideRings: true,
    hasGemCrest: true,
    hasLidGems: true,
    gemColors: ['#d8b4fe', '#7e22ce'],
    containerBgReady: 'bg-gradient-to-b from-purple-950/80 via-zinc-950 to-zinc-950',
    containerBorderReady: 'border-purple-500/70 hover:border-purple-400',
    containerShadowReady: 'shadow-[0_0_35px_rgba(168,85,247,0.35)] hover:shadow-[0_0_50px_rgba(168,85,247,0.55)]',
    rayGlow: 'rgba(168,85,247,0.25)',
    badgeBg: 'bg-purple-950/80',
    badgeText: 'text-purple-300',
    badgeBorder: 'border-purple-500/50',
    sparkleColor: 'text-purple-300',
  },

  // 5. Legendary: Supreme Celestial Sunburst Gold & Ruby Diamond
  legendary: {
    name: 'Legendary',
    bodyGradient: ['#b45309', '#d97706', '#78350f'],
    trimGradient: ['#f59e0b', '#fbbf24', '#fef08a', '#ffffff'],
    innerGlow: ['#fef08a', '#f59e0b', '#f43f5e'],
    rivetColor: '#ffffff',
    hasSideRings: true,
    hasGemCrest: true,
    hasLidGems: true,
    gemColors: ['#fda4af', '#e11d48'],
    containerBgReady: 'bg-gradient-to-b from-amber-950/90 via-zinc-950 to-amber-950/80',
    containerBorderReady: 'border-amber-400/80 hover:border-amber-300',
    containerShadowReady: 'shadow-[0_0_45px_rgba(245,158,11,0.5)] hover:shadow-[0_0_60px_rgba(245,158,11,0.7)]',
    rayGlow: 'rgba(245,158,11,0.35)',
    badgeBg: 'bg-amber-950/90',
    badgeText: 'text-amber-200',
    badgeBorder: 'border-amber-400/70',
    sparkleColor: 'text-amber-200',
  },
}

// Helper to infer rarity from tier label if not explicitly provided
function resolveRarity(rarity?: ChestRarity, tierLabel?: string): ChestRarity {
  if (rarity && RARITY_THEMES[rarity]) return rarity
  if (!tierLabel) return 'common'

  const lower = tierLabel.toLowerCase()
  if (lower.includes('legend') || lower.includes('celestial') || lower.includes('mythic') || lower.includes('titan') || lower.includes('tier 5')) {
    return 'legendary'
  }
  if (lower.includes('epic') || lower.includes('amethyst') || lower.includes('purple') || lower.includes('tier 4')) {
    return 'epic'
  }
  if (lower.includes('rare') || lower.includes('sapphire') || lower.includes('blue') || lower.includes('silver') || lower.includes('tier 3')) {
    return 'rare'
  }
  if (lower.includes('uncommon') || lower.includes('verdant') || lower.includes('emerald') || lower.includes('green') || lower.includes('tier 2')) {
    return 'uncommon'
  }
  return 'common'
}

export function TreasureChestVisual({
  state,
  rarity,
  tierLabel,
  tierColor,
  className,
  onClick,
  hideLabels = false
}: TreasureChestVisualProps) {
  const uniqueId = useId().replace(/:/g, '')
  const activeRarity = resolveRarity(rarity, tierLabel)
  const theme = RARITY_THEMES[activeRarity]

  const isOpening = state === 'opening'
  const isReady = state === 'ready'
  const isClaimed = state === 'claimed'
  const isLocked = state === 'locked'

  const displayLabel = tierLabel || `${theme.name} chest`

  return (
    <div
      onClick={isReady ? onClick : undefined}
      className={cn(
        "relative flex flex-col items-center justify-center p-5 sm:p-6 rounded-2xl border transition-all duration-500 overflow-hidden group select-none",
        isReady && cn("cursor-pointer hover:scale-105", theme.containerBgReady, theme.containerBorderReady, theme.containerShadowReady),
        isOpening && cn("border-amber-400 bg-amber-950/90 shadow-[0_0_50px_rgba(245,158,11,0.7)] animate-pulse"),
        isClaimed && "border-zinc-800 bg-zinc-950/80 opacity-70 grayscale",
        isLocked && "border-zinc-800/80 bg-zinc-950/90 opacity-80",
        className
      )}
    >
      {/* Background Ambient Rays for Ready/Opening */}
      {(isReady || isOpening) && (
        <div 
          className="absolute inset-0 animate-pulse pointer-events-none" 
          style={{ background: `radial-gradient(circle at center, ${theme.rayGlow}, transparent 70%)` }}
        />
      )}

      {/* SVG Medieval Chest Illustration */}
      <div className="relative w-32 h-26 sm:w-36 sm:h-28 flex items-center justify-center my-1.5">
        {/* Sparkle Particle FX */}
        {(isReady || isOpening) && (
          <>
            <Sparkles className={cn("w-5 h-5 absolute -top-2 -left-1 animate-bounce", theme.sparkleColor)} />
            <Sparkles className={cn("w-4 h-4 absolute -top-1 -right-2 animate-ping", theme.sparkleColor)} />
            <Sparkles className={cn("w-5 h-5 absolute -bottom-1 -right-2 animate-pulse", theme.sparkleColor)} />
            {activeRarity === 'legendary' && (
              <Sparkles className="w-6 h-6 text-amber-200 absolute -top-3 left-1/2 -translate-x-1/2 animate-spin" />
            )}
          </>
        )}

        <svg viewBox="0 0 130 105" className="w-full h-full drop-shadow-[0_12px_18px_rgba(0,0,0,0.85)]">
          <defs>
            {/* Chest Body Gradient */}
            <linearGradient id={`bodyGrad_${uniqueId}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={theme.bodyGradient[0]} />
              <stop offset="50%" stopColor={theme.bodyGradient[1]} />
              <stop offset="100%" stopColor={theme.bodyGradient[2]} />
            </linearGradient>

            {/* Metal Trim & Reinforcement Gradient */}
            <linearGradient id={`trimGrad_${uniqueId}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={theme.trimGradient[0]} />
              <stop offset="35%" stopColor={theme.trimGradient[1]} />
              <stop offset="70%" stopColor={theme.trimGradient[2]} />
              <stop offset="100%" stopColor={theme.trimGradient[3]} />
            </linearGradient>

            {/* Inner Treasure Light Glow */}
            <radialGradient id={`innerGlow_${uniqueId}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={theme.innerGlow[0]} stopOpacity="1" />
              <stop offset="50%" stopColor={theme.innerGlow[1]} stopOpacity="0.8" />
              <stop offset="100%" stopColor={theme.innerGlow[2]} stopOpacity="0" />
            </radialGradient>

            {/* Gemstone Radial Gradient (Epic & Legendary) */}
            {theme.hasGemCrest && theme.gemColors && (
              <radialGradient id={`gemGrad_${uniqueId}`} cx="40%" cy="40%" r="60%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                <stop offset="25%" stopColor={theme.gemColors[0]} />
                <stop offset="100%" stopColor={theme.gemColors[1]} />
              </radialGradient>
            )}
          </defs>

          {/* Side Drop-Ring Handles (Epic & Legendary - as seen in screenshot) */}
          {theme.hasSideRings && (
            <g className="opacity-90">
              {/* Left Mount Bracket & Drop Ring */}
              <rect x="14" y="58" width="6" height="8" rx="2" fill={`url(#trimGrad_${uniqueId})`} />
              <circle cx="17" cy="71" r="7.5" fill="none" stroke={`url(#trimGrad_${uniqueId})`} strokeWidth="3" />
              
              {/* Right Mount Bracket & Drop Ring */}
              <rect x="110" y="58" width="6" height="8" rx="2" fill={`url(#trimGrad_${uniqueId})`} />
              <circle cx="113" cy="71" r="7.5" fill="none" stroke={`url(#trimGrad_${uniqueId})`} strokeWidth="3" />
            </g>
          )}

          {/* Chest Base Body */}
          <rect 
            x="20" 
            y="48" 
            width="90" 
            height="46" 
            rx="6" 
            fill={`url(#bodyGrad_${uniqueId})`} 
            stroke="#18181b" 
            strokeWidth="2" 
          />

          {/* Bottom Plinth Trim Bar */}
          <rect 
            x="18" 
            y="90" 
            width="94" 
            height="5" 
            rx="2" 
            fill={`url(#trimGrad_${uniqueId})`} 
            stroke="#18181b" 
            strokeWidth="1" 
          />

          {/* Vertical Reinforcement Straps on Base */}
          <rect x="30" y="48" width="10" height="42" fill={`url(#trimGrad_${uniqueId})`} />
          <rect x="90" y="48" width="10" height="42" fill={`url(#trimGrad_${uniqueId})`} />

          {/* Corner Rivets / Studs */}
          <circle cx="35" cy="54" r="1.6" fill={theme.rivetColor} />
          <circle cx="35" cy="85" r="1.6" fill={theme.rivetColor} />
          <circle cx="95" cy="54" r="1.6" fill={theme.rivetColor} />
          <circle cx="95" cy="85" r="1.6" fill={theme.rivetColor} />

          {/* Inner Treasure Glow when Opening or Claimed */}
          {(isOpening || isClaimed) && (
            <ellipse cx="65" cy="48" rx="38" ry="14" fill={`url(#innerGlow_${uniqueId})`} />
          )}

          {/* Chest Lid (Lifts and Tilts on Opening / Claimed) */}
          <g
            className={cn(
              "transition-transform duration-700 ease-out origin-[65px_48px]",
              isOpening && "-translate-y-6 rotate-[-15deg]",
              isClaimed && "-translate-y-9 rotate-[-25deg]"
            )}
          >
            {/* Domed Roof */}
            <path
              d="M 17 48 C 17 21 113 21 113 48 Z"
              fill={`url(#bodyGrad_${uniqueId})`}
              stroke="#18181b"
              strokeWidth="2"
            />

            {/* Lid Straps */}
            <path d="M 30 48 C 30 26 40 26 40 48 Z" fill={`url(#trimGrad_${uniqueId})`} />
            <path d="M 90 48 C 90 26 100 26 100 48 Z" fill={`url(#trimGrad_${uniqueId})`} />

            {/* Lid Rim Bar */}
            <rect x="16" y="44" width="98" height="6" rx="2" fill={`url(#trimGrad_${uniqueId})`} stroke="#18181b" strokeWidth="1" />

            {/* Gem Studs on Lid Corners (Epic & Legendary) */}
            {theme.hasLidGems && theme.gemColors && (
              <>
                <circle cx="25" cy="40" r="3" fill={`url(#gemGrad_${uniqueId})`} stroke={`url(#trimGrad_${uniqueId})`} strokeWidth="1" />
                <circle cx="105" cy="40" r="3" fill={`url(#gemGrad_${uniqueId})`} stroke={`url(#trimGrad_${uniqueId})`} strokeWidth="1" />
              </>
            )}
          </g>

          {/* Center Lock Clasp */}
          {theme.hasGemCrest ? (
            /* Ornate Golden Shield Clasp with Faceted Gemstone (Center chest in screenshot) */
            <g className="filter drop-shadow-md">
              {/* Outer Golden Shield Frame */}
              <path
                d="M 53 38 L 77 38 L 77 56 Q 65 70 65 70 Q 53 56 53 38 Z"
                fill={`url(#trimGrad_${uniqueId})`}
                stroke="#451a03"
                strokeWidth="1.5"
              />
              {/* Inner Glowing Gemstone Heart/Diamond */}
              <path
                d="M 56 41 L 74 41 L 74 54 Q 65 65 65 65 Q 56 54 56 41 Z"
                fill={`url(#gemGrad_${uniqueId})`}
                stroke="#18181b"
                strokeWidth="0.8"
              />
              {/* Gemstone Facet Glint */}
              <polygon points="65,43 72,48 65,60 58,48" fill="#ffffff" opacity="0.3" />
            </g>
          ) : (
            /* Classic Medieval Lock Plate with Keyhole */
            <g>
              <rect 
                x="55" 
                y="42" 
                width="20" 
                height="22" 
                rx="3" 
                fill={`url(#trimGrad_${uniqueId})`} 
                stroke="#18181b" 
                strokeWidth="1.5" 
              />
              {/* Keyhole Slot */}
              <circle cx="65" cy="50" r="3" fill="#18181b" />
              <polygon points="63.5,50 66.5,50 67,58 63,58" fill="#18181b" />
            </g>
          )}
        </svg>
      </div>

      {/* Tier Label Badge */}
      {!hideLabels && (
        <div className="mt-2 text-center space-y-1 z-10">
          <span className={cn(
            "px-3 py-1 rounded-full font-serif text-xs font-bold tracking-wider shadow-md border",
            theme.badgeBg,
            theme.badgeText,
            theme.badgeBorder
          )}>
            {displayLabel}
          </span>

          {isClaimed && (
            <div className="flex items-center justify-center gap-1 text-[11px] text-zinc-400 font-medium mt-1 font-serif">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Claimed today
            </div>
          )}

          {isLocked && (
            <div className="flex items-center justify-center gap-1 text-[10px] sm:text-[11px] text-zinc-400 font-medium mt-1 font-serif">
              <Lock className="w-3.5 h-3.5 text-amber-500" />
              Locked • objective required
            </div>
          )}

          {isReady && (
            <div className={cn("text-[11px] font-bold animate-pulse mt-1 font-serif", theme.badgeText)}>
              Tap to open {theme.name.toLowerCase()} chest!
            </div>
          )}
        </div>
      )}
    </div>
  )
}
