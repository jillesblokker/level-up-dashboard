import { cn } from "@/lib/utils"
import Image from "next/image"

interface CityTileProps {
  className?: string
  ariaLabel?: string
  onClick?: () => void
  rotation?: number
}

export function CityTile({ className, ariaLabel, onClick, rotation = 0 }: CityTileProps) {
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
        src="/images/tiles/city-tile.png"
        alt="City tile"
        fill
        className="object-cover"
      />
    </div>
  )
} 