interface WaterTileProps {
  className?: string
  ariaLabel?: string
  onClick?: () => void
}

export function WaterTile({ className, ariaLabel, onClick }: WaterTileProps) {
  return (
    <div className={`w-full h-full relative ${className || ""}`} aria-label={ariaLabel || "Water tile"} onClick={onClick}>
      <svg viewBox="0 0 64 64" className="w-full h-full">
        {/* Base water color */}
        <rect width="64" height="64" fill="#4a80f5" />

        {/* Water movement lines */}
        <path d="M10,20 Q32,10 54,20" fill="none" stroke="#6a9af5" strokeWidth="2" strokeLinecap="round" />

        <path d="M10,32 Q32,22 54,32" fill="none" stroke="#6a9af5" strokeWidth="2" strokeLinecap="round" />

        <path d="M10,44 Q32,34 54,44" fill="none" stroke="#6a9af5" strokeWidth="2" strokeLinecap="round" />

        {/* Lighter water highlights */}
        <path
          d="M10,20 Q32,10 54,20"
          fill="none"
          stroke="#8ab5ff"
          strokeWidth="1"
          strokeLinecap="round"
          strokeDasharray="2,3"
        />

        <path
          d="M10,32 Q32,22 54,32"
          fill="none"
          stroke="#8ab5ff"
          strokeWidth="1"
          strokeLinecap="round"
          strokeDasharray="2,3"
        />

        <path
          d="M10,44 Q32,34 54,44"
          fill="none"
          stroke="#8ab5ff"
          strokeWidth="1"
          strokeLinecap="round"
          strokeDasharray="2,3"
        />
      </svg>
    </div>
  )
}

