interface LavaTileProps {
  className?: string
  ariaLabel?: string
  onClick?: () => void
}

export function LavaTile({ className, ariaLabel, onClick }: LavaTileProps) {
  return (
    <div 
      className={`w-full h-full relative min-h-[44px] min-w-[44px] active:scale-95 transition-transform ${className || ""}`} 
      aria-label={ariaLabel || "Lava tile"}
      onClick={onClick}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
      role={onClick ? "button" : undefined}
    >
      <svg viewBox="0 0 64 64" className="w-full h-full" aria-hidden="true">
        {/* Base lava color - bright orange */}
        <rect width="64" height="64" fill="#FF5722" />

        {/* Lava flow patterns */}
        <g fill="#FF7043" opacity="0.7">
          <path d="M0,10 Q16,5 32,15 Q48,25 64,20 L64,30 Q48,35 32,25 Q16,15 0,20 Z" />
          <path d="M0,40 Q16,35 32,45 Q48,55 64,50 L64,60 Q48,65 32,55 Q16,45 0,50 Z" />
        </g>

        {/* Brighter lava spots */}
        <g fill="#FFAB91">
          <circle cx="15" cy="15" r="4" />
          <circle cx="45" cy="25" r="3" />
          <circle cx="25" cy="40" r="5" />
          <circle cx="55" cy="45" r="4" />
          <circle cx="10" cy="55" r="3" />
        </g>

        {/* Darker lava cracks */}
        <g fill="none" stroke="#BF360C" strokeWidth="1">
          <path d="M5,5 L15,15 L25,10 L35,20 L45,15 L55,25" />
          <path d="M10,30 L20,35 L30,30 L40,40 L50,35 L60,45" />
          <path d="M5,50 L15,55 L25,50 L35,60" />
        </g>

        {/* Lava bubbles */}
        <g fill="#FFCCBC" opacity="0.8">
          <circle cx="20" cy="20" r="1.5" />
          <circle cx="40" cy="15" r="1" />
          <circle cx="30" cy="35" r="1.5" />
          <circle cx="50" cy="40" r="1" />
          <circle cx="15" cy="45" r="1.5" />
          <circle cx="35" cy="50" r="1" />
        </g>
      </svg>
    </div>
  )
}

