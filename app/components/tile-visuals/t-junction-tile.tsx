import { cn } from "@/lib/utils"

interface TJunctionTileProps {
  className?: string
  ariaLabel?: string
  onClick?: () => void
  rotation?: number
}

export function TJunctionTile({ className, ariaLabel, onClick, rotation = 0 }: TJunctionTileProps) {
  return (
    <div
      className={cn(
        "w-full h-full bg-[#4CAF50] relative",
        className
      )}
      style={{ transform: `rotate(${rotation}deg)` }}
      aria-label={ariaLabel || "T-junction tile"}
      onClick={onClick}
    >
      <div className="absolute inset-0">
        {/* Horizontal road */}
        <div className="absolute w-full h-1/3 top-1/3 bg-[#8c8c8c]" />
        
        {/* Vertical road (half) */}
        <div className="absolute h-1/2 w-1/3 left-1/3 bottom-0 bg-[#8c8c8c]" />
        
        {/* Road edges */}
        <div className="absolute w-full h-[2px] bg-[#6d6d6d] top-1/3" />
        <div className="absolute w-full h-[2px] bg-[#6d6d6d] bottom-1/3" />
        <div className="absolute h-1/2 w-[2px] bg-[#6d6d6d] left-1/3 bottom-0" />
        <div className="absolute h-1/2 w-[2px] bg-[#6d6d6d] right-2/3 bottom-0" />
      </div>
    </div>
  )
} 