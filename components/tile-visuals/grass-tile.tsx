import { cn } from "@/lib/utils"

interface GrassTileProps {
  className?: string
  ariaLabel?: string
  onClick?: () => void
}

export function GrassTile({ className, ariaLabel, onClick }: GrassTileProps) {
  return (
    <div
      className={cn(
        "w-full h-full bg-[#7CB342] relative min-h-[44px] min-w-[44px] active:scale-95 transition-transform",
        className
      )}
      aria-label={ariaLabel || "Grass tile"}
      onClick={onClick}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
      {...(onClick ? { role: "button" } : {})}
      // Inline styles below are used for dynamic positioning of grass blades and cannot be moved to CSS.
    >
      <div className="absolute inset-0" aria-hidden="true">
        {Array.from({ length: 4 }).map((_, i) => (
          Array.from({ length: 4 }).map((_, j) => (
            <div
              key={`grass-${i}-${j}`}
              className="absolute w-1 h-2 bg-[#8BC34A]"
              style={{
                left: `${20 + j * 20}%`,
                top: `${20 + i * 20}%`,
              }}
            />
          ))
        ))}
      </div>
    </div>
  )
}

