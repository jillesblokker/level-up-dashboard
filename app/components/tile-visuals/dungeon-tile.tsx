import { cn } from "@/lib/utils"

interface DungeonTileProps {
  className?: string
  ariaLabel?: string
  onClick?: () => void
}

export function DungeonTile({ className, ariaLabel, onClick }: DungeonTileProps) {
  return (
    <div
      className={cn(
        "w-full h-full bg-[#795548] relative",
        className
      )}
      aria-label={ariaLabel || "Dungeon tile"}
      onClick={onClick}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-2/3 h-2/3 bg-[#5D4037] rounded-lg" />
      </div>
    </div>
  )
} 