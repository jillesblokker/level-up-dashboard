import { cn } from "@/lib/utils"

interface MysteryTileProps {
  className?: string
  ariaLabel?: string
  onClick?: () => void
}

export function MysteryTile({ className, ariaLabel, onClick }: MysteryTileProps) {
  return (
    <div
      className={cn(
        "w-full h-full bg-[#673AB7] relative",
        className
      )}
      aria-label={ariaLabel || "Mystery tile"}
      onClick={onClick}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-2/3 h-2/3 bg-[#512DA8] rounded-lg flex items-center justify-center text-white text-2xl font-bold">
          ?
        </div>
      </div>
    </div>
  )
} 