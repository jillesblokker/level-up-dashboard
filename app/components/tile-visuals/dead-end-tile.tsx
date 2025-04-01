import { cn } from "@/lib/utils"

interface DeadEndTileProps {
  className?: string
  ariaLabel?: string
  onClick?: () => void
  rotation?: number
}

export function DeadEndTile({ className, ariaLabel, onClick, rotation = 0 }: DeadEndTileProps) {
  return (
    <div
      className={cn(
        "w-full h-full bg-[#4CAF50] relative",
        className
      )}
      style={{ transform: `rotate(${rotation}deg)` }}
      aria-label={ariaLabel || "Dead end tile"}
      onClick={onClick}
    >
      <div className="absolute inset-0">
        {/* Vertical road (half) */}
        <div className="absolute h-1/2 w-1/3 left-1/3 bottom-0 bg-[#8c8c8c]" />
        
        {/* Road edges */}
        <div className="absolute h-1/2 w-[2px] bg-[#6d6d6d] left-1/3 bottom-0" />
        <div className="absolute h-1/2 w-[2px] bg-[#6d6d6d] right-2/3 bottom-0" />
        
        {/* Dead end cap */}
        <div className="absolute w-1/3 h-[2px] bg-[#6d6d6d] bottom-1/2 left-1/3" />
      </div>
    </div>
  )
} 