import { cn } from "@/lib/utils"

interface SpecialTileProps {
  className?: string
  ariaLabel?: string
  onClick?: () => void
}

export function SpecialTile({ className, ariaLabel, onClick }: SpecialTileProps) {
  return (
    <div
      className={cn(
        "w-full h-full bg-[#9C27B0] relative",
        className
      )}
      aria-label={ariaLabel || "Special tile"}
      onClick={onClick}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-2/3 h-2/3 bg-[#7B1FA2] rounded-full" />
      </div>
    </div>
  )
} 