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
        "w-full h-full bg-[#7CB342] relative",
        className
      )}
      aria-label={ariaLabel || "Grass tile"}
      onClick={onClick}
    >
      <div className="absolute inset-0">
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

