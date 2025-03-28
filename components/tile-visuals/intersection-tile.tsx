interface IntersectionTileProps {
  className?: string
  ariaLabel?: string
  onClick?: () => void
}

export function IntersectionTile({ className, ariaLabel, onClick }: IntersectionTileProps) {
  return (
    <div
      className={`w-full h-full relative ${className || ""}`}
      aria-label={ariaLabel || "Intersection tile"}
      role="img"
      onClick={onClick}
    >
      <svg viewBox="0 0 64 64" className="w-full h-full">
        {/* Green background */}
        <rect width="64" height="64" fill="#4CAF50" />

        {/* Grass texture with different shades */}
        <g fill="#388E3C" opacity="0.7">
          <path d="M5,10 C7,5 10,8 8,12 Z" />
          <path d="M55,10 C57,5 60,8 58,12 Z" />
          <path d="M5,54 C7,49 10,52 8,56 Z" />
          <path d="M55,54 C57,49 60,52 58,56 Z" />
        </g>

        {/* Horizontal road */}
        <rect x="0" y="24" width="64" height="16" fill="#8c8c8c" />

        {/* Vertical road */}
        <rect x="24" y="0" width="16" height="64" fill="#8c8c8c" />

        {/* Road details - stones and texture */}
        <g fill="#a0a0a0" opacity="0.7">
          {/* Horizontal road stones */}
          <rect x="4" y="28" width="8" height="3" rx="1" />
          <rect x="16" y="28" width="8" height="3" rx="1" />
          <rect x="40" y="28" width="8" height="3" rx="1" />
          <rect x="52" y="28" width="8" height="3" rx="1" />

          <rect x="4" y="33" width="8" height="3" rx="1" />
          <rect x="16" y="33" width="8" height="3" rx="1" />
          <rect x="40" y="33" width="8" height="3" rx="1" />
          <rect x="52" y="33" width="8" height="3" rx="1" />

          {/* Vertical road stones */}
          <rect x="28" y="4" width="3" height="8" rx="1" />
          <rect x="33" y="4" width="3" height="8" rx="1" />
          <rect x="28" y="16" width="3" height="8" rx="1" />
          <rect x="33" y="16" width="3" height="8" rx="1" />
          <rect x="28" y="40" width="3" height="8" rx="1" />
          <rect x="33" y="40" width="3" height="8" rx="1" />
          <rect x="28" y="52" width="3" height="8" rx="1" />
          <rect x="33" y="52" width="3" height="8" rx="1" />
        </g>

        {/* Road edges */}
        <rect x="0" y="24" width="64" height="1" fill="#6d6d6d" />
        <rect x="0" y="39" width="64" height="1" fill="#6d6d6d" />
        <rect x="24" y="0" width="1" height="64" fill="#6d6d6d" />
        <rect x="39" y="0" width="1" height="64" fill="#6d6d6d" />
      </svg>
    </div>
  )
}

