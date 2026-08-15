'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export type OrbColor = 'gold' | 'purple' | 'green' | 'red' | 'cyan';

interface MedievalOrbIconProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  color?: OrbColor;
  size?: 'sm' | 'md' | 'lg';
}

export function MedievalOrbIcon({ children, color = 'gold', size = 'md', className, ...props }: MedievalOrbIconProps) {
  const colorStyles: Record<OrbColor, string> = {
    gold: 'border-2 border-amber-400 bg-radial from-amber-400 via-amber-700 to-[#2a1704] text-amber-100 shadow-[0_0_18px_rgba(245,158,11,0.65),inset_0_2px_4px_rgba(255,255,255,0.4)]',
    purple: 'border-2 border-purple-400 bg-radial from-purple-600 via-purple-900 to-[#120524] text-purple-100 shadow-[0_0_18px_rgba(168,85,247,0.65),inset_0_2px_4px_rgba(255,255,255,0.4)]',
    green: 'border-2 border-emerald-400 bg-radial from-emerald-500 via-emerald-900 to-[#042116] text-emerald-100 shadow-[0_0_18px_rgba(34,197,94,0.65),inset_0_2px_4px_rgba(255,255,255,0.4)]',
    red: 'border-2 border-red-500 bg-radial from-rose-600 via-red-900 to-[#280404] text-yellow-200 shadow-[0_0_18px_rgba(239,68,68,0.65),inset_0_2px_4px_rgba(255,255,255,0.4)]',
    cyan: 'border-2 border-cyan-400 bg-radial from-cyan-500 via-cyan-900 to-[#041a24] text-cyan-100 shadow-[0_0_18px_rgba(6,182,212,0.65),inset_0_2px_4px_rgba(255,255,255,0.4)]',
  };

  const sizeStyles: Record<'sm' | 'md' | 'lg', string> = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-xl',
  };

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-bold shrink-0 transition-transform hover:scale-105 relative overflow-hidden",
        sizeStyles[size],
        colorStyles[color],
        className
      )}
      {...props}
    >
      {/* Specular Glass Curved Arc Highlight */}
      <div className="absolute top-0.5 left-1.5 w-3 h-1.5 rounded-full bg-white/40 blur-[0.5px] pointer-events-none transform -rotate-12" />
      <span className="relative z-10 filter drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.9)]">{children}</span>
    </div>
  );
}
