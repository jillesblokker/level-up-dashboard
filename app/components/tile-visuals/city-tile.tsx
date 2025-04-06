import { cn } from "@/lib/utils"
import Image from "next/image"

interface CityTileProps {
  className?: string
  ariaLabel?: string
  onClick?: () => void
  rotation?: number
  isSelected?: boolean
}

export function CityTile({ className, ariaLabel, onClick, rotation = 0, isSelected }: CityTileProps) {
  return (
    <div
      className={cn(
        "w-full h-full relative",
        className
      )}
      style={{ transform: `rotate(${rotation}deg)` }}
      aria-label={ariaLabel || "City tile"}
      onClick={onClick}
    >
      <Image
        alt="City Tile"
        src="/images/tiles/city-tile.png"
        fill
        className={cn(
          "object-cover transition-transform duration-200",
          isSelected && "scale-110"
        )}
      />
    </div>
  )
} 