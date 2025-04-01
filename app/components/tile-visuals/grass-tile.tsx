import { cn } from "@/lib/utils"
import Image from "next/image"

interface GrassTileProps {
  className?: string
  ariaLabel?: string
  onClick?: () => void
  rotation?: number
}

export function GrassTile({ className, ariaLabel, onClick, rotation = 0 }: GrassTileProps) {
  return (
    <div
      className={cn(
        "w-full h-full relative",
        className
      )}
      style={{ transform: `rotate(${rotation}deg)` }}
      aria-label={ariaLabel || "Grass tile"}
      onClick={onClick}
    >
      <Image
        src="/assets/tiles/grass-tile.png?v=1"
        alt="Grass tile"
        fill
        className="object-cover"
        priority={true}
        unoptimized={true}
        loading="eager"
      />
    </div>
  )
} 