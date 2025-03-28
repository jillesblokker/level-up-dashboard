import { cn } from "@/lib/utils"

interface RoadTileProps {
  className?: string
  ariaLabel?: string
  onClick?: () => void
  rotation?: number
}

export function RoadTile({ className, ariaLabel, onClick, rotation = 0 }: RoadTileProps) {
  return (
    <div
      className={cn(
        "w-full h-full bg-[#90A4AE] relative",
        className
      )}
      style={{ transform: `rotate(${rotation}deg)` }}
      aria-label={ariaLabel || "Road tile"}
      onClick={onClick}
    >
      <div className="absolute inset-0">
        <div className="absolute w-full h-1/3 top-1/3 bg-[#78909C]" />
        <div className="absolute w-full h-[2px] bg-[#ECEFF1] top-[40%]" />
        <div className="absolute w-full h-[2px] bg-[#ECEFF1] bottom-[40%]" />
      </div>
    </div>
  )
}

