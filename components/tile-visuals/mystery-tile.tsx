import React from "react"
import { cn } from "@/lib/utils"

interface MysteryTileProps {
  className?: string
  ariaLabel?: string
  onClick?: () => void
}

export function MysteryTile({ className, ariaLabel = "Mystery tile", onClick }: MysteryTileProps) {
  return (
    <div
      className={cn(
        "w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-800 to-indigo-900 cursor-pointer relative overflow-hidden",
        className
      )}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      {/* Question mark */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-amber-400 font-bold text-4xl opacity-80">?</div>
      </div>
      
      {/* Sparkling effects */}
      <div className="absolute w-2 h-2 bg-white rounded-full top-1/4 left-1/4 animate-pulse opacity-70" />
      <div className="absolute w-1.5 h-1.5 bg-amber-300 rounded-full top-2/3 left-1/3 animate-ping opacity-60" />
      <div className="absolute w-1 h-1 bg-amber-100 rounded-full bottom-1/4 right-1/4 animate-pulse opacity-90" />
      <div className="absolute w-2 h-2 bg-purple-200 rounded-full top-1/2 right-1/3 animate-ping opacity-50" />
      
      {/* Mystical fog effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/50 to-transparent opacity-70" />
      
      {/* Border effect */}
      <div className="absolute inset-0 border-2 border-amber-500/30 rounded-sm" />
    </div>
  )
} 