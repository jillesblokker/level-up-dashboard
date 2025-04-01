import { cn } from "@/lib/utils"

interface SnowTileProps {
  className?: string
  ariaLabel?: string
  onClick?: () => void
}

export function SnowTile({ className, ariaLabel, onClick }: SnowTileProps) {
  return (
    <div
      className={cn(
        "w-full h-full bg-[#E3F2FD] relative",
        className
      )}
      aria-label={ariaLabel || "Snow tile"}
      onClick={onClick}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-2/3 h-2/3 bg-[#BBDEFB] rounded-full" />
      </div>
    </div>
  )
} 