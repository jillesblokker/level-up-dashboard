'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface MedievalCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'filigree' | 'gold';
}

export function MedievalCard({ children, className, variant = 'filigree', ...props }: MedievalCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-2xl p-5 transition-all duration-300 overflow-hidden",
        "bg-[#161D33] border-2 border-amber-500/40 text-white shadow-[0_4px_25px_rgba(0,0,0,0.6)]",
        "hover:border-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.25)]",
        className
      )}
      {...props}
    >
      {/* Top Gold Inset Highlight */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/70 to-transparent pointer-events-none" />
      
      {/* Filigree Corner Accents */}
      <div className="absolute top-1 left-1.5 text-amber-500/40 text-[10px] select-none pointer-events-none">✦</div>
      <div className="absolute top-1 right-1.5 text-amber-500/40 text-[10px] select-none pointer-events-none">✦</div>
      
      {children}
    </div>
  );
}
