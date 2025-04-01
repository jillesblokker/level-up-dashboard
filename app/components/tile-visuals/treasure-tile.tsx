import { cn } from "@/lib/utils"

interface TreasureTileProps {
  className?: string
  ariaLabel?: string
  onClick?: () => void
}

export function TreasureTile({ className, ariaLabel, onClick }: TreasureTileProps) {
  return (
    <div
      className={cn(
        "w-full h-full bg-[#FFC107] relative",
        className
      )}
      aria-label={ariaLabel || "Treasure tile"}
      onClick={onClick}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-2/3 h-2/3 bg-[#FFA000] rounded-lg" />
      </div>
    </div>
  )
} 