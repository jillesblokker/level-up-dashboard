import React from "react";
import { cn } from "@/lib/utils";

interface DungeonTileProps {
  className?: string;
  ariaLabel?: string;
  onClick?: () => void;
}

export function DungeonTile({ className, ariaLabel = "Dungeon tile", onClick }: DungeonTileProps) {
  return (
    <div
      className={cn(
        "w-full h-full flex items-center justify-center bg-gradient-to-br from-stone-800 to-stone-950 cursor-pointer relative overflow-hidden",
        className
      )}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      {/* Stone background texture */}
      <div className="absolute inset-0">
        <div className="absolute w-3 h-3 bg-stone-700 rounded-sm top-1 left-1"></div>
        <div className="absolute w-4 h-2 bg-stone-700 rounded-sm top-2 left-6"></div>
        <div className="absolute w-3 h-3 bg-stone-700 rounded-sm top-1 right-2"></div>
        <div className="absolute w-2 h-4 bg-stone-700 rounded-sm bottom-2 right-4"></div>
        <div className="absolute w-4 h-3 bg-stone-700 rounded-sm bottom-1 left-3"></div>
        <div className="absolute w-3 h-2 bg-stone-700 rounded-sm bottom-5 right-1"></div>
        <div className="absolute w-2 h-2 bg-stone-700 rounded-sm top-5 right-7"></div>
        <div className="absolute w-5 h-2 bg-stone-700 rounded-sm top-6 left-2"></div>
      </div>
      
      {/* Dungeon entrance (cave or door) */}
      <div className="absolute w-8 h-10 bg-black rounded-t-lg left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/3 z-10">
        {/* Door frame */}
        <div className="absolute inset-0 border-2 border-stone-600 rounded-t-lg"></div>
        
        {/* Steps */}
        <div className="absolute w-10 h-1 bg-stone-700 bottom-0 left-1/2 transform -translate-x-1/2 rounded"></div>
        <div className="absolute w-12 h-1 bg-stone-700 bottom-[-4px] left-1/2 transform -translate-x-1/2 rounded"></div>
      </div>
      
      {/* Mysterious glow from inside */}
      <div className="absolute w-6 h-6 bg-purple-900/30 rounded-full left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/3 blur-sm z-5 animate-pulse"></div>
      
      {/* Ambient effects */}
      <div className="absolute w-1 h-1 bg-purple-400/70 rounded-full top-1/3 left-1/3 animate-ping opacity-40"></div>
      <div className="absolute w-1 h-1 bg-purple-300/70 rounded-full bottom-1/3 right-1/3 animate-pulse opacity-30"></div>
      
      {/* Border effect */}
      <div className="absolute inset-0 border-2 border-stone-600/40 rounded-sm"></div>
      
      {/* Fog effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
    </div>
  );
} 