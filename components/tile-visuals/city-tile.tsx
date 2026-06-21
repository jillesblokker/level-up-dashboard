"use client"

import React from 'react';
import { Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CityTileProps {
  className?: string;
  ariaLabel?: string;
  onClick?: () => void;
  isMainTile?: boolean;
  citySize?: number;
}

export function CityTile({ className, ariaLabel, onClick, isMainTile, citySize }: CityTileProps) {
  return (
    <div 
      className={cn(
        "w-full h-full flex items-center justify-center min-h-[44px] min-w-[44px] active:scale-95 transition-transform",
        isMainTile && citySize === 2 && "scale-150",
        className
      )}
      onClick={onClick}
      aria-label={ariaLabel || "city-tile"}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
      {...(onClick ? { role: "button" } : {})}
    >
      <Building2 className={cn(
        "text-blue-400",
        isMainTile && citySize === 2 ? "w-12 h-12" : "w-8 h-8"
      )} aria-hidden="true" />
    </div>
  );
}

