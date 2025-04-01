import { cn } from "@/lib/utils"

interface MonsterTileProps {
  className?: string
  ariaLabel?: string
  onClick?: () => void
}

export function MonsterTile({ className, ariaLabel, onClick }: MonsterTileProps) {
  return (
    <div
      className={cn(
        "w-full h-full bg-[#F44336] relative",
        className
      )}
      aria-label={ariaLabel || "Monster tile"}
      onClick={onClick}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-2/3 h-2/3 bg-[#D32F2F] rounded-lg" />
      </div>
    </div>
  )
} 