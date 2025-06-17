"use client"

interface TownTileProps {
  className?: string
  ariaLabel?: string
  onClick?: () => void
}

export function TownTile({ className, ariaLabel, onClick }: TownTileProps) {
  return (
    <div 
      className={`w-full h-full relative ${className || ""}`} 
      aria-label={ariaLabel || "Town tile"} 
      role="img"
      onClick={onClick}
    >
      <svg viewBox="0 0 64 64" className="w-full h-full">
        {/* Grass background */}
        <rect width="64" height="64" fill="#4CAF50" />
        
        {/* Grass texture */}
        <g fill="#388E3C" opacity="0.7">
          <path d="M5 10C7 5 10 8 8 12Z" />
          <path d="M55 10C57 5 60 8 58 12Z" />
          <path d="M5 54C7 49 10 52 8 56Z" />
          <path d="M55 54C57 49 60 52 58 56Z" />
        </g>

        {/* Buildings - Top Left Quarter */}
        <g>
          {/* Timber house */}
          <rect x="8" y="12" width="16" height="14" fill="#8B4513" />
          <path d="M8 12L16 6L24 12" fill="#A0522D" />
          <path d="M8 19L24 19M16 12L16 26" stroke="#DEB887" />
          <rect x="10" y="14" width="4" height="4" fill="#DEB887" />
          <rect x="18" y="14" width="4" height="4" fill="#DEB887" />
        </g>

        {/* Buildings - Top Right Quarter */}
        <g>
          {/* Church */}
          <rect x="40" y="16" width="18" height="16" fill="#D2B48C" />
          <path d="M40 16L49 6L58 16" fill="#8B4513" />
          <rect x="47" y="4" width="4" height="8" fill="#8B4513" />
          <path d="M48 2L51 4L48 6" fill="#8B4513" />
          <rect x="44" y="20" width="3" height="6" fill="#DEB887" />
          <rect x="51" y="20" width="3" height="6" fill="#DEB887" />
        </g>

        {/* Buildings - Bottom Left Quarter */}
        <g>
          {/* Market stalls */}
          <rect x="4" y="44" width="20" height="12" fill="#DEB887" />
          <path d="M4 44L14 40L24 44" fill="#CD5C5C" />
          {/* Goods */}
          <rect x="6" y="46" width="4" height="4" fill="#DAA520" />
          <rect x="12" y="46" width="4" height="4" fill="#CD853F" />
          <rect x="18" y="46" width="4" height="4" fill="#8B4513" />
        </g>

        {/* Buildings - Bottom Right Quarter */}
        <g>
          {/* Inn */}
          <rect x="40" y="44" width="20" height="16" fill="#8B4513" />
          <path d="M38 44L50 38L60 44" fill="#A0522D" />
          {/* Windows and door */}
          <rect x="42" y="46" width="4" height="4" fill="#DEB887" />
          <rect x="54" y="46" width="4" height="4" fill="#DEB887" />
          <rect x="48" y="50" width="4" height="10" fill="#DEB887" />
          {/* Inn sign */}
          <rect x="44" y="48" width="4" height="2" fill="#DAA520" />
        </g>

        {/* Well in Center */}
        <g>
          <circle cx="32" cy="32" r="4" fill="#A0522D" />
          <path d="M28 32A4 4 0 0 1 36 32" fill="none" stroke="#8B4513" strokeWidth="2" />
          <rect x="28" y="28" width="8" height="2" fill="#8B4513" />
        </g>

        {/* Trees and Bushes */}
        <g>
          <circle cx="24" cy="16" r="4" fill="#228B22" />
          <circle cx="44" cy="48" r="3" fill="#228B22" />
          <circle cx="16" cy="44" r="3" fill="#228B22" />
        </g>
      </svg>
    </div>
  )
} 