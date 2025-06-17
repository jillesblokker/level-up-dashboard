interface ForestTileProps {
  className?: string
  ariaLabel?: string
  onClick?: () => void
}

export function ForestTile({ className, ariaLabel, onClick }: ForestTileProps) {
  return (
    <div 
      className={`w-full h-full relative ${className || ""}`} 
      aria-label={ariaLabel || "Forest tile"} 
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
      onClick={onClick}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true">
        {/* Dark green background */}
        <rect width="100" height="100" fill="#2d6a1e" />

        {/* Ground texture */}
        <g fill="#245618" opacity="0.7">
          <ellipse cx="20" cy="85" rx="15" ry="5" />
          <ellipse cx="50" cy="90" rx="20" ry="6" />
          <ellipse cx="80" cy="87" rx="18" ry="5" />
        </g>

        {/* Pine Tree 1 - Left */}
        <g transform="translate(25, 20) scale(0.8)">
          {/* Tree trunk */}
          <rect x="8" y="50" width="4" height="20" fill="#8B4513" />
          {/* Tree layers */}
          <polygon points="10,10 0,30 20,30" fill="#0f5132" />
          <polygon points="10,20 0,40 20,40" fill="#0f5132" />
          <polygon points="10,30 0,50 20,50" fill="#0f5132" />
        </g>

        {/* Pine Tree 2 - Center */}
        <g transform="translate(50, 15)">
          {/* Tree trunk */}
          <rect x="8" y="50" width="4" height="20" fill="#8B4513" />
          {/* Tree layers */}
          <polygon points="10,10 0,30 20,30" fill="#0f5132" />
          <polygon points="10,20 0,40 20,40" fill="#0f5132" />
          <polygon points="10,30 0,50 20,50" fill="#0f5132" />
        </g>

        {/* Pine Tree 3 - Right */}
        <g transform="translate(75, 25) scale(0.9)">
          {/* Tree trunk */}
          <rect x="8" y="50" width="4" height="20" fill="#8B4513" />
          {/* Tree layers */}
          <polygon points="10,10 0,30 20,30" fill="#0f5132" />
          <polygon points="10,20 0,40 20,40" fill="#0f5132" />
          <polygon points="10,30 0,50 20,50" fill="#0f5132" />
        </g>

        {/* Small bushes and details */}
        <ellipse cx="15" cy="75" rx="8" ry="5" fill="#1a4314" />
        <ellipse cx="85" cy="70" rx="10" ry="6" fill="#1a4314" />
        <ellipse cx="40" cy="80" rx="7" ry="4" fill="#1a4314" />
      </svg>
    </div>
  )
}

