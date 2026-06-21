import React from "react";
import { cn } from "@/lib/utils";

interface TreasureTileProps {
  className?: string;
  ariaLabel?: string;
  onClick?: () => void;
}

export function TreasureTile({ className, ariaLabel = "Treasure tile", onClick }: TreasureTileProps) {
  return (
    <div
      className={cn(
        "w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-800 to-amber-950 cursor-pointer relative overflow-hidden",
        className
      )}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      {/* Base grass/dirt background */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-800/50 to-amber-950/70"></div>
      
      {/* Treasure chest */}
      <div className="absolute w-10 h-6 bg-amber-800 rounded-t-md left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
        {/* Chest lid */}
        <div className="absolute w-10 h-2 bg-amber-700 rounded-t-md top-0 left-0"></div>
        
        {/* Chest lock */}
        <div className="absolute w-2 h-2 bg-yellow-500 rounded-full top-2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20"></div>
        
        {/* Gold spilling out */}
        <div className="absolute w-2 h-2 bg-yellow-400 rounded-full top-1 left-2 z-30 animate-pulse"></div>
        <div className="absolute w-1.5 h-1.5 bg-yellow-300 rounded-full top-0 left-6 z-30 animate-ping"></div>
        <div className="absolute w-2 h-2 bg-yellow-500 rounded-full top-2 right-2 z-30 animate-pulse"></div>
      </div>
      
      {/* Sparkling effects */}
      <div className="absolute w-1 h-1 bg-yellow-300 rounded-full top-1/3 left-1/4 animate-pulse"></div>
      <div className="absolute w-1 h-1 bg-yellow-200 rounded-full bottom-1/3 right-1/4 animate-ping opacity-70"></div>
      <div className="absolute w-1.5 h-1.5 bg-yellow-400 rounded-full bottom-1/4 left-1/3 animate-pulse"></div>
      
      {/* Border effect */}
      <div className="absolute inset-0 border-2 border-amber-500/30 rounded-sm"></div>
    </div>
  );
} 