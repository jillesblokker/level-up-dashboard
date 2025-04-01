import { cn } from "@/lib/utils"

interface CornerRoadTileProps {
  className?: string
  ariaLabel?: string
  onClick?: () => void
  rotation?: number
}

export function CornerRoadTile({ className, ariaLabel, onClick, rotation = 0 }: CornerRoadTileProps) {
  return (
    <div
      className={cn(
        "w-full h-full bg-[#90A4AE] relative",
        className
      )}
      style={{ transform: `rotate(${rotation}deg)` }}
      aria-label={ariaLabel || "Corner road tile"}
      onClick={onClick}
    >
      <div className="absolute inset-0">
        {/* Vertical road section */}
        <div className="absolute left-1/3 top-0 w-1/3 h-1/2 bg-[#78909C]" />
        <div className="absolute left-[35%] top-0 w-[2px] h-1/2 bg-[#ECEFF1]" />
        <div className="absolute left-[60%] top-0 w-[2px] h-1/2 bg-[#ECEFF1]" />
        
        {/* Horizontal road section */}
        <div className="absolute left-1/2 top-1/3 w-1/2 h-1/3 bg-[#78909C]" />
        <div className="absolute left-1/2 top-[35%] w-1/2 h-[2px] bg-[#ECEFF1]" />
        <div className="absolute left-1/2 top-[60%] w-1/2 h-[2px] bg-[#ECEFF1]" />
        
        {/* Corner curve - smoother transition */}
        <div 
          className="absolute left-1/3 top-1/3 w-1/6 h-1/6 bg-[#78909C]"
          style={{
            borderBottomRightRadius: '100%'
          }}
        />
      </div>
    </div>
  )
} 