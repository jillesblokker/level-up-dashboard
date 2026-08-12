import React, { useState, useEffect } from 'react';
import { calculateFillCurve } from '@/lib/house-cup-utils';
import { cn } from '@/lib/utils';

export interface HourglassProps {
  categoryId: string;
  categoryName: string;
  emoji: string;
  color: string;
  points: number;
  seenPoints?: number;
  staggerDelayMs?: number;
  variant?: 'large' | 'compact';
  onClick?: () => void;
  className?: string;
}

export function Hourglass({
  categoryId,
  categoryName,
  emoji,
  color,
  points,
  seenPoints,
  staggerDelayMs = 0,
  variant = 'large',
  onClick,
  className,
}: HourglassProps) {
  const [animatedPoints, setAnimatedPoints] = useState<number>(
    seenPoints !== undefined ? seenPoints : points
  );
  const [showDeltaBadge, setShowDeltaBadge] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setAnimatedPoints(points);
      if (seenPoints !== undefined && points > seenPoints) {
        setShowDeltaBadge(true);
      }
      return undefined;
    }

    if (seenPoints !== undefined && points !== seenPoints) {
      const timer = setTimeout(() => {
        setAnimatedPoints(points);
      }, staggerDelayMs);
      return () => clearTimeout(timer);
    } else {
      setAnimatedPoints(points);
      return undefined;
    }
  }, [points, seenPoints, staggerDelayMs]);

  const fillRatio = calculateFillCurve(animatedPoints); // 0 to 1
  const fillPercentage = fillRatio * 100;
  const isOverflow = animatedPoints > 50000;
  const delta = seenPoints !== undefined ? points - seenPoints : 0;

  // Bottom chamber fill Y height calculation inside 100px SVG viewbox
  // Bottom chamber spans from Y=50 (neck) to Y=86 (bottom base)
  const bottomChamberHeight = 36;
  const fillY = 86 - (fillRatio * bottomChamberHeight);

  if (variant === 'compact') {
    return (
      <div
        onClick={onClick}
        title={`${categoryName}: ${points.toLocaleString()} pts`}
        className={cn(
          "relative flex flex-col items-center justify-center cursor-pointer group hover:scale-105 transition-all p-1.5 rounded-lg bg-zinc-950/70 border border-amber-900/30 hover:border-amber-500/50 w-full",
          className
        )}
      >
        <div className="flex items-center gap-1 text-[11px] font-semibold text-zinc-200 group-hover:text-amber-300">
          <span className="select-none text-xs">{emoji}</span>
          <span className="capitalize text-[10px] font-bold truncate max-w-[60px]">{categoryName}</span>
        </div>

        <svg viewBox="0 0 40 90" className="w-8 h-14 drop-shadow-md my-0.5">
          <defs>
            <linearGradient id={`goldGrad-${categoryId}-c`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#9a7b38" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>
            <linearGradient id={`sandGrad-${categoryId}-c`} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor={color} />
              <stop offset="100%" stopColor={color} stopOpacity="0.8" />
            </linearGradient>
            <clipPath id={`bottomBulbClip-${categoryId}-c`}>
              <path d="M 20 48 Q 10 58 10 78 C 10 84 30 84 30 84 C 30 84 30 78 30 78 Q 30 58 20 48 Z" />
            </clipPath>
          </defs>

          {/* Frame Top & Bottom Bands */}
          <rect x="5" y="4" width="30" height="4" rx="1.5" fill={`url(#goldGrad-${categoryId}-c)`} />
          <rect x="5" y="82" width="30" height="4" rx="1.5" fill={`url(#goldGrad-${categoryId}-c)`} />
          <line x1="8" y1="8" x2="8" y2="82" stroke="#b45309" strokeWidth="1.5" />
          <line x1="32" y1="8" x2="32" y2="82" stroke="#b45309" strokeWidth="1.5" />

          {/* Top Glass Chamber */}
          <path
            d="M 10 8 Q 10 38 20 48 Q 30 38 30 8 Z"
            fill="rgba(255, 255, 255, 0.08)"
            stroke="rgba(245, 158, 11, 0.3)"
            strokeWidth="1"
          />

          {/* Bottom Glass Chamber */}
          <path
            d="M 20 48 Q 10 58 10 78 C 10 84 30 84 30 84 Q 30 58 20 48 Z"
            fill="rgba(255, 255, 255, 0.08)"
            stroke="rgba(245, 158, 11, 0.3)"
            strokeWidth="1"
          />

          {/* Liquid/Sand Fill in Bottom Chamber with Glowing Liquid Surface */}
          <g clipPath={`url(#bottomBulbClip-${categoryId}-c)`}>
            <rect
              x="5"
              y={fillY}
              width="30"
              height={bottomChamberHeight + 10}
              fill={`url(#sandGrad-${categoryId}-c)`}
              className="transition-all duration-700 ease-in-out transform-gpu"
            />
            {fillRatio > 0 && (
              <path
                d={`M 5 ${fillY} Q 20 ${fillY - 3} 35 ${fillY} Z`}
                fill={color}
                stroke="#ffffff"
                strokeWidth="1.5"
                strokeOpacity="0.9"
                className="transition-all duration-700 ease-in-out animate-pulse shadow-md transform-gpu"
              />
            )}
          </g>

          {/* Trickling Stream */}
          {fillRatio > 0 && fillRatio < 1 && (
            <line
              x1="20"
              y1="48"
              x2="20"
              y2={Math.min(84, fillY + 5)}
              stroke={color}
              strokeWidth="1.5"
              strokeDasharray="2,2"
              className="animate-pulse"
            />
          )}

          {/* Glass Highlights */}
          <path d="M 12 12 Q 11 25 15 35" stroke="rgba(255,255,255,0.4)" strokeWidth="1" fill="none" />
          <path d="M 12 75 Q 11 65 15 55" stroke="rgba(255,255,255,0.3)" strokeWidth="1" fill="none" />
        </svg>

        <span className="text-[10px] font-bold text-amber-300 bg-zinc-900 px-1.5 py-0.5 rounded border border-amber-500/30">
          {animatedPoints > 999 ? `${(animatedPoints / 1000).toFixed(1)}k` : animatedPoints} pts
        </span>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2 cursor-pointer group p-3 rounded-xl bg-zinc-950/90 border border-amber-900/30 hover:border-amber-500/50 transition-all hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] relative min-w-[90px]",
        className
      )}
    >
      {/* Overflow Sparkle Particle Aura for Maxed Hourglasses */}
      {points >= 5000 && (
        <div className="absolute inset-0 border-2 border-amber-400/80 rounded-xl blur-[1px] shadow-[0_0_15px_rgba(245,158,11,0.6)] pointer-events-none animate-pulse" />
      )}
      {/* Delta Badge */}
      {showDeltaBadge && delta > 0 && (
        <div className="absolute -top-2 -right-1 bg-amber-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-bounce shadow-md z-10">
          +{delta}
        </div>
      )}

      {/* Category Title Header */}
      <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200 group-hover:text-amber-300 transition-colors">
        <span className="text-sm select-none">{emoji}</span>
        <span className="capitalize text-[11px] font-bold tracking-tight">{categoryName}</span>
      </div>

      {/* 2-Chambered Medieval Hourglass SVG */}
      <div className="relative w-14 h-28 flex items-center justify-center">
        <svg viewBox="0 0 50 100" className="w-full h-full filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">
          <defs>
            {/* Metallic Gold Cap & Base Gradient */}
            <linearGradient id={`goldGrad-${categoryId}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#78350f" />
              <stop offset="30%" stopColor="#f59e0b" />
              <stop offset="50%" stopColor="#fef08a" />
              <stop offset="70%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#451a03" />
            </linearGradient>

            {/* Virtue Sand/Liquid Gradient */}
            <linearGradient id={`sandGrad-${categoryId}`} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor={color} />
              <stop offset="70%" stopColor={color} />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.6" />
            </linearGradient>

            {/* Bottom Bulb Clip Path for Sand Height */}
            <clipPath id={`bottomBulbClip-${categoryId}`}>
              <path d="M 25 48 Q 12 60 12 82 C 12 86 38 86 38 82 Q 38 60 25 48 Z" />
            </clipPath>
          </defs>

          {/* Outer Side Brass Pillars */}
          <rect x="7" y="10" width="3" height="78" rx="1" fill={`url(#goldGrad-${categoryId})`} />
          <rect x="40" y="10" width="3" height="78" rx="1" fill={`url(#goldGrad-${categoryId})`} />

          {/* Top Cap & Base Podium */}
          <rect x="4" y="5" width="42" height="6" rx="2" fill={`url(#goldGrad-${categoryId})`} stroke="#451a03" strokeWidth="0.5" />
          <rect x="4" y="87" width="42" height="7" rx="2" fill={`url(#goldGrad-${categoryId})`} stroke="#451a03" strokeWidth="0.5" />

          {/* Glass Outer Glow */}
          <path
            d="M 12 11 Q 12 36 25 48 Q 38 36 38 11 Z"
            fill="rgba(255, 255, 255, 0.05)"
            stroke="rgba(245, 158, 11, 0.35)"
            strokeWidth="1.5"
          />
          <path
            d="M 25 48 Q 12 60 12 86 C 12 88 38 88 38 86 Q 38 60 25 48 Z"
            fill="rgba(255, 255, 255, 0.05)"
            stroke="rgba(245, 158, 11, 0.35)"
            strokeWidth="1.5"
          />

          {/* Bottom Chamber Liquid/Sand Fill */}
          <g clipPath={`url(#bottomBulbClip-${categoryId})`}>
            <rect
              x="6"
              y={fillY}
              width="38"
              height={bottomChamberHeight + 15}
              fill={`url(#sandGrad-${categoryId})`}
              className="transition-all duration-1000 ease-out"
            />
            {/* Overflow Top Shimmer Line */}
            {isOverflow && (
              <line x1="10" y1={fillY} x2="40" y2={fillY} stroke="#ffffff" strokeWidth="2" className="animate-pulse" />
            )}
          </g>

          {/* Trickling Particles Stream through Neck */}
          {fillRatio > 0 && fillRatio < 1 && (
            <g>
              <line
                x1="25"
                y1="46"
                x2="25"
                y2={Math.min(84, fillY + 4)}
                stroke={color}
                strokeWidth="2"
                strokeDasharray="3,3"
                className="animate-pulse"
              />
              <circle cx="25" cy={fillY - 2} r="1.5" fill="#ffffff" />
            </g>
          )}

          {/* Center Brass Ring / Neck Joint */}
          <rect x="20" y="46" width="10" height="4" rx="1" fill={`url(#goldGrad-${categoryId})`} />

          {/* Glass Curved Shimmer Highlights */}
          <path d="M 15 15 Q 14 30 18 40" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          <path d="M 15 80 Q 14 68 18 56" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        </svg>
      </div>

      {/* Points Counter Badge */}
      <div className="text-[11px] font-bold text-amber-300 bg-zinc-900/90 px-2 py-0.5 rounded-md border border-amber-500/20 shadow-inner">
        {animatedPoints > 999 ? `${(animatedPoints / 1000).toFixed(1)}k` : animatedPoints} pts
      </div>
    </div>
  );
}
