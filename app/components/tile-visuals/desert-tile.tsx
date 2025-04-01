import { cn } from "@/lib/utils"
import Image from "next/image"

interface DesertTileProps {
  className?: string
  ariaLabel?: string
  onClick?: () => void
  rotation?: number
}

export function DesertTile({ className, ariaLabel, onClick, rotation = 0 }: DesertTileProps) {
  return (
    <div
      className={cn(
        "w-full h-full relative",
        className
      )}
      style={{ transform: `rotate(${rotation}deg)` }}
      aria-label={ariaLabel || "Desert tile"}
      onClick={onClick}
    >
      <Image
        src="/images/tiles/desert-tile.png"
        alt="Desert tile"
        fill
        className="object-cover"
      />
    </div>
  )
} 