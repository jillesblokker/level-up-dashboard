interface SwampTileProps {
  className?: string
  ariaLabel?: string
}

export function SwampTile({ className, ariaLabel }: SwampTileProps) {
  return (
    <div className={`w-full h-full relative ${className || ""}`} aria-label={ariaLabel || "Swamp tile"} role="img">
      <svg viewBox="0 0 64 64" className="w-full h-full">
        {/* Base swamp color - green/brownish */}
        <rect width="64" height="64" fill="#5D4037" />

        {/* Swamp mud texture */}
        <g fill="#795548" opacity="0.7">
          <ellipse cx="16" cy="16" rx="12" ry="8" />
          <ellipse cx="48" cy="24" rx="10" ry="6" />
          <ellipse cx="24" cy="40" rx="14" ry="10" />
          <ellipse cx="52" cy="48" rx="8" ry="6" />
        </g>

        {/* Swamp water patches */}
        <g fill="#4CAF50" opacity="0.5">
          <ellipse cx="32" cy="16" rx="8" ry="4" />
          <ellipse cx="12" cy="32" rx="6" ry="3" />
          <ellipse cx="48" cy="40" rx="10" ry="5" />
          <ellipse cx="28" cy="52" rx="7" ry="4" />
        </g>

        {/* Swamp plants */}
        <g fill="#33691E">
          <path d="M10,10 C12,6 14,8 12,12 C16,10 18,14 14,16 Z" />
          <path d="M50,20 C52,16 54,18 52,22 C56,20 58,24 54,26 Z" />
          <path d="M20,45 C22,41 24,43 22,47 C26,45 28,49 24,51 Z" />
          <path d="M45,50 C47,46 49,48 47,52 C51,50 53,54 49,56 Z" />
        </g>

        {/* Swamp reeds */}
        <g stroke="#33691E" strokeWidth="1" fill="none">
          <path d="M15,25 C15,20 17,18 17,15" />
          <path d="M17,25 C17,21 19,19 19,17" />
          <path d="M40,15 C40,10 42,8 42,5" />
          <path d="M42,15 C42,11 44,9 44,7" />
          <path d="M30,45 C30,40 32,38 32,35" />
          <path d="M32,45 C32,41 34,39 34,37" />
          <path d="M55,35 C55,30 57,28 57,25" />
          <path d="M57,35 C57,31 59,29 59,27" />
        </g>

        {/* Swamp bubbles */}
        <g fill="#8D6E63" opacity="0.6">
          <circle cx="25" cy="20" r="1" />
          <circle cx="45" cy="15" r="0.8" />
          <circle cx="15" cy="40" r="1.2" />
          <circle cx="35" cy="45" r="0.9" />
          <circle cx="55" cy="40" r="1.1" />
        </g>
      </svg>
    </div>
  )
}

