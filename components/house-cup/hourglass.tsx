import React from 'react';
import { calculateFillCurve } from '@/lib/house-cup-service';
import { cn } from '@/lib/utils';

export interface HourglassProps {
  categoryId: string;
  categoryName: string;
  emoji: string;
  color: string;
  points: number;
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
  variant = 'large',
  onClick,
  className,
}: HourglassProps) {
  const fillPercentage = calculateFillCurve(points) * 100;
  const isOverflow = points > 50000;

  if (variant === 'compact') {
    return (
      <div
        onClick={onClick}
        title={`${categoryName}: ${points.toLocaleString()} pts`}
        className={cn(
          "relative w-4 h-7 rounded-sm border border-amber-900/40 bg-zinc-950/80 overflow-hidden flex flex-col justify-end cursor-pointer group hover:scale-110 transition-transform",
          className
        )}
      >
        {/* Sand Fill */}
        <div
          className="w-full transition-all duration-700 ease-out rounded-b-sm"
          style={{
            height: `${fillPercentage}%`,
            backgroundColor: color,
            boxShadow: isOverflow ? `0 0 6px ${color}` : undefined,
          }}
        />
        {/* Category Glyph */}
        <span className="absolute inset-0 flex items-center justify-center text-[9px] select-none opacity-80 group-hover:opacity-100">
          {emoji}
        </span>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1.5 cursor-pointer group p-2 rounded-xl bg-zinc-900/60 border border-amber-900/20 hover:border-amber-500/40 transition-all hover:shadow-[0_0_15px_rgba(245,158,11,0.15)]",
        className
      )}
    >
      {/* Category Header */}
      <div className="flex items-center gap-1 text-xs font-medium text-zinc-300 group-hover:text-amber-400 transition-colors">
        <span className="text-sm select-none">{emoji}</span>
        <span className="capitalize">{categoryName}</span>
      </div>

      {/* Hourglass Container */}
      <div className="relative w-12 h-24 rounded-lg border-2 border-amber-800/40 bg-zinc-950 flex flex-col justify-end overflow-hidden shadow-inner">
        {/* Overflow Rim Shimmer */}
        {isOverflow && (
          <div className="absolute top-0 inset-x-0 h-1 bg-amber-300 animate-pulse shadow-[0_0_8px_#fde047]" />
        )}

        {/* Sand Fill */}
        <div
          className="w-full transition-all duration-700 ease-out rounded-b-sm"
          style={{
            height: `${fillPercentage}%`,
            background: `linear-gradient(to top, ${color}, ${color}dd)`,
            boxShadow: `0 0 10px ${color}88`,
          }}
        />

        {/* Hourglass Waist Marker */}
        <div className="absolute top-1/2 inset-x-0 border-b border-amber-900/30 pointer-events-none" />

        {/* Points Display */}
        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] select-none">
          {points > 999 ? `${(points / 1000).toFixed(1)}k` : points}
        </div>
      </div>
    </div>
  );
}
