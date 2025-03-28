import { cn } from "@/lib/utils"

interface CrossroadTileProps {
  className?: string
  ariaLabel?: string
  onClick?: () => void
  rotation?: number
}

export function CrossroadTile({ className, ariaLabel, onClick, rotation = 0 }: CrossroadTileProps) {
  return (
    <div
      className={cn(
        "w-full h-full bg-[#90A4AE] relative",
        className
      )}
      style={{ transform: `rotate(${rotation}deg)` }}
      aria-label={ariaLabel || "Crossroad tile"}
      onClick={onClick}
    >
      <div className="absolute inset-0">
        <div className="absolute w-full h-1/3 top-1/3 bg-[#78909C]" />
        <div className="absolute h-full w-1/3 left-1/3 bg-[#78909C]" />
        <div className="absolute w-full h-[2px] bg-[#ECEFF1] top-[40%]" />
        <div className="absolute w-full h-[2px] bg-[#ECEFF1] bottom-[40%]" />
        <div className="absolute h-full w-[2px] bg-[#ECEFF1] left-[40%]" />
        <div className="absolute h-full w-[2px] bg-[#ECEFF1] right-[40%]" />
      </div>
    </div>
  )
}

