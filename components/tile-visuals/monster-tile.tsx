import React from "react";
import { cn } from "@/lib/utils";

interface MonsterTileProps {
  className?: string;
  ariaLabel?: string;
  onClick?: () => void;
}

export function MonsterTile({ className, ariaLabel = "Monster tile", onClick }: MonsterTileProps) {
  return (
    <div
      className={cn(
        "w-full h-full flex items-center justify-center bg-gradient-to-br from-red-900 to-red-950 cursor-pointer relative overflow-hidden",
        className
      )}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      {/* Dark background */}
      <div className="absolute inset-0 bg-gradient-to-b from-red-900/70 to-red-950/90"></div>
      
      {/* Monster silhouette */}
      <div className="absolute w-10 h-12 left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
        {/* Head */}
        <div className="absolute w-6 h-6 bg-red-950 rounded-full left-1/2 top-0 transform -translate-x-1/2"></div>
        
        {/* Eyes */}
        <div className="absolute w-1.5 h-1 bg-red-500 rounded-full top-2 left-1.5 transform rotate-12 animate-pulse"></div>
        <div className="absolute w-1.5 h-1 bg-red-500 rounded-full top-2 right-1.5 transform -rotate-12 animate-pulse"></div>
        
        {/* Body */}
        <div className="absolute w-8 h-7 bg-red-950 rounded-lg top-4 left-1/2 transform -translate-x-1/2"></div>
        
        {/* Arms/claws */}
        <div className="absolute w-2 h-4 bg-red-950 rounded-full top-5 left-0 transform -rotate-45"></div>
        <div className="absolute w-2 h-4 bg-red-950 rounded-full top-5 right-0 transform rotate-45"></div>
      </div>
      
      {/* Ambient effects - blood or magic */}
      <div className="absolute w-full h-2 bg-red-600/20 bottom-0 animate-pulse"></div>
      <div className="absolute w-1 h-1 bg-red-400 rounded-full top-1/4 left-1/4 animate-ping opacity-70"></div>
      <div className="absolute w-1 h-1 bg-red-400 rounded-full bottom-1/4 right-1/4 animate-pulse opacity-60"></div>
      
      {/* "Danger" pulsing border */}
      <div className="absolute inset-0 border-2 border-red-600/50 rounded-sm animate-pulse"></div>
      
      {/* Fog/mist effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
    </div>
  );
} 