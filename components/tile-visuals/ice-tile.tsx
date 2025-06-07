interface IceTileProps {
  className?: string
  ariaLabel?: string
  onClick?: () => void
}

export function IceTile({ className, ariaLabel, onClick }: IceTileProps) {
  return (
    <div className={`w-full h-full relative ${className || ""}`} aria-label={ariaLabel || "Ice tile"} role="img" onClick={onClick}>
      <svg viewBox="0 0 64 64" className="w-full h-full">
        {/* Base ice color - light blue */}
        <rect width="64" height="64" fill="#B3E5FC" />

        {/* Ice cracks and details */}
        <g fill="none" stroke="#81D4FA" strokeWidth="1">
          <path d="M10,10 L20,20 L30,15 L40,25 L50,20" />
          <path d="M15,30 L25,35 L35,30 L45,40 L55,35" />
          <path d="M5,45 L15,50 L25,45 L35,55 L45,50" />
        </g>

        {/* Ice crystals */}
        <g fill="#E1F5FE">
          <polygon points="15,15 18,12 21,15 18,18" />
          <polygon points="40,30 43,27 46,30 43,33" />
          <polygon points="25,45 28,42 31,45 28,48" />
          <polygon points="50,50 53,47 56,50 53,53" />
        </g>

        {/* Highlights */}
        <g fill="#FFFFFF" opacity="0.7">
          <circle cx="10" cy="25" r="3" />
          <circle cx="30" cy="40" r="2" />
          <circle cx="45" cy="15" r="4" />
          <circle cx="20" cy="55" r="3" />
        </g>

        {/* Shadows */}
        <g fill="#81D4FA" opacity="0.3">
          <rect x="5" y="5" width="10" height="10" rx="2" />
          <rect x="35" y="20" width="15" height="10" rx="2" />
          <rect x="15" y="40" width="12" height="8" rx="2" />
          <rect x="45" y="45" width="10" height="10" rx="2" />
        </g>
      </svg>
    </div>
  )
}

