"use client"

interface SnowTileProps {
  onClick?: () => void
  className?: string
  ariaLabel?: string
}

export function SnowTile({ onClick, className, ariaLabel = "Snow tile" }: SnowTileProps) {
  return (
    <div
      className={`w-full h-full relative cursor-pointer ${className || ""}`}
      onClick={onClick}
      aria-label={ariaLabel}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
    >
      {/* White background */}
      <div className="absolute inset-0 bg-white" aria-hidden="true"></div>

      {/* Snowflake pattern */}
      <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Main snowflake */}
          <g stroke="#e0e0e0" strokeWidth="2" fill="none">
            {/* Vertical line */}
            <line x1="50" y1="10" x2="50" y2="90" />
            {/* Horizontal line */}
            <line x1="10" y1="50" x2="90" y2="50" />
            {/* Diagonal lines */}
            <line x1="25" y1="25" x2="75" y2="75" />
            <line x1="25" y1="75" x2="75" y2="25" />

            {/* Small details */}
            <line x1="50" y1="10" x2="45" y2="20" />
            <line x1="50" y1="10" x2="55" y2="20" />

            <line x1="50" y1="90" x2="45" y2="80" />
            <line x1="50" y1="90" x2="55" y2="80" />

            <line x1="10" y1="50" x2="20" y2="45" />
            <line x1="10" y1="50" x2="20" y2="55" />

            <line x1="90" y1="50" x2="80" y2="45" />
            <line x1="90" y1="50" x2="80" y2="55" />

            <line x1="25" y1="25" x2="35" y2="30" />
            <line x1="25" y1="25" x2="30" y2="35" />

            <line x1="75" y1="75" x2="65" y2="70" />
            <line x1="75" y1="75" x2="70" y2="65" />

            <line x1="25" y1="75" x2="35" y2="70" />
            <line x1="25" y1="75" x2="30" y2="65" />

            <line x1="75" y1="25" x2="65" y2="30" />
            <line x1="75" y1="25" x2="70" y2="35" />
          </g>

          {/* Center circle */}
          <circle cx="50" cy="50" r="5" fill="#e0e0e0" />
        </svg>
      </div>

      {/* Snow tile label */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/30 py-1 px-1 text-center" aria-hidden="true">
        <span className="text-xs text-white truncate">Snow</span>
      </div>
    </div>
  )
}

