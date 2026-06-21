import { cn } from "@/lib/utils"

interface MountainTileProps {
  className?: string
  ariaLabel?: string
  onClick?: () => void
  rotation?: number
}

export function MountainTile({ className, ariaLabel, onClick, rotation = 0 }: MountainTileProps) {
  return (
    <div 
      className={cn(
        "w-full h-full bg-[#795548] relative overflow-hidden",
        className
      )}
      style={{ transform: `rotate(${rotation}deg)` }}
      aria-label={ariaLabel || "Mountain tile"} 
      onClick={onClick}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
    >
      <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
        <div 
          className="w-3/4 h-3/4"
          style={{
            background: '#8D6E63',
            clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'
          }}
        />
        {/* Snow caps */}
        <div 
          className="absolute top-1/4 left-1/2 w-1/6 h-1/6 bg-white"
          style={{
            transform: 'translateX(-50%)',
            clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'
          }}
        />
      </div>
    </div>
  )
}

