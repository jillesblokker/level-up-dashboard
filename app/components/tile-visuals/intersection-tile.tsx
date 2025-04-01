import { cn } from "@/lib/utils"

interface IntersectionTileProps {
  className?: string
  ariaLabel?: string
  onClick?: () => void
}

export function IntersectionTile({ className, ariaLabel, onClick }: IntersectionTileProps) {
  return (
    <div
      className={cn(
        "w-full h-full bg-[#4CAF50] relative",
        className
      )}
      aria-label={ariaLabel || "Intersection tile"}
      onClick={onClick}
    >
      <div className="absolute inset-0">
        {/* Horizontal road */}
        <div className="absolute w-full h-1/3 top-1/3 bg-[#8c8c8c]" />
        
        {/* Vertical road */}
        <div className="absolute h-full w-1/3 left-1/3 bg-[#8c8c8c]" />
        
        {/* Road edges */}
        <div className="absolute w-full h-[2px] bg-[#6d6d6d] top-1/3" />
        <div className="absolute w-full h-[2px] bg-[#6d6d6d] bottom-1/3" />
        <div className="absolute h-full w-[2px] bg-[#6d6d6d] left-1/3" />
        <div className="absolute h-full w-[2px] bg-[#6d6d6d] right-2/3" />
      </div>
    </div>
  )
} 