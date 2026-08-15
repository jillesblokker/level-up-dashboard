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
    gold: 'border-amber-400/80 bg-gradient-to-b from-amber-950/80 via-zinc-950 to-amber-950/40 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.5)]',
    purple: 'border-purple-400/80 bg-gradient-to-b from-purple-950/80 via-zinc-950 to-purple-950/40 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.5)]',
    green: 'border-emerald-400/80 bg-gradient-to-b from-emerald-950/80 via-zinc-950 to-emerald-950/40 text-emerald-300 shadow-[0_0_15px_rgba(34,197,94,0.5)]',
    red: 'border-red-400/80 bg-gradient-to-b from-red-950/80 via-zinc-950 to-red-950/40 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.5)]',
    cyan: 'border-cyan-400/80 bg-gradient-to-b from-cyan-950/80 via-zinc-950 to-cyan-950/40 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.5)]',
  };

  const sizeStyles: Record<'sm' | 'md' | 'lg', string> = {
    sm: 'w-8 h-8 text-sm border',
    md: 'w-12 h-12 text-base border-2',
    lg: 'w-16 h-16 text-xl border-2',
  };

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-bold shrink-0 transition-transform hover:scale-105 relative",
        sizeStyles[size],
        colorStyles[color],
        className
      )}
      {...props}
    >
      {/* Inner Orb Specular Highlight */}
      <div className="absolute top-1 left-2 w-2.5 h-2.5 rounded-full bg-white/20 blur-[0.5px] pointer-events-none" />
      {children}
    </div>
  );
}
