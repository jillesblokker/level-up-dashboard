interface DesertTileProps {
  className?: string
  ariaLabel?: string
  onClick?: () => void
}

export function DesertTile({ className, ariaLabel, onClick }: DesertTileProps) {
  return (
    <div 
      className={`w-full h-full relative ${className || ""}`} 
      aria-label={ariaLabel || "Desert tile"} 
      onClick={onClick}
    >
      <svg viewBox="0 0 64 64" className="w-full h-full">
        {/* Sand-colored background */}
        <rect width="64" height="64" fill="#F4D03F" />

        {/* Sand texture with different shades */}
        <g fill="#F1C40F" opacity="0.7">
          <path d="M0,0 L10,5 L15,15 L5,20 L0,10 Z" />
          <path d="M20,0 L30,5 L35,15 L25,20 L20,10 Z" />
          <path d="M40,0 L50,5 L55,15 L45,20 L40,10 Z" />

          <path d="M10,20 L20,25 L25,35 L15,40 L10,30 Z" />
          <path d="M30,20 L40,25 L45,35 L35,40 L30,30 Z" />
          <path d="M50,20 L60,25 L64,35 L55,40 L50,30 Z" />

          <path d="M0,40 L10,45 L15,55 L5,60 L0,50 Z" />
          <path d="M20,40 L30,45 L35,55 L25,60 L20,50 Z" />
          <path d="M40,40 L50,45 L55,55 L45,60 L40,50 Z" />
        </g>

        {/* Darker sand ripples */}
        <g fill="#E67E22" opacity="0.3">
          <path d="M5,5 C10,7 15,5 20,7 C15,9 10,7 5,9 Z" />
          <path d="M25,15 C30,17 35,15 40,17 C35,19 30,17 25,19 Z" />
          <path d="M45,5 C50,7 55,5 60,7 C55,9 50,7 45,9 Z" />

          <path d="M5,25 C10,27 15,25 20,27 C15,29 10,27 5,29 Z" />
          <path d="M25,35 C30,37 35,35 40,37 C35,39 30,37 25,39 Z" />
          <path d="M45,25 C50,27 55,25 60,27 C55,29 50,27 45,29 Z" />

          <path d="M5,45 C10,47 15,45 20,47 C15,49 10,47 5,49 Z" />
          <path d="M25,55 C30,57 35,55 40,57 C35,59 30,57 25,59 Z" />
          <path d="M45,45 C50,47 55,45 60,47 C55,49 50,47 45,49 Z" />
        </g>

        {/* Small stones or details */}
        <g fill="#D0D0D0" opacity="0.5">
          <circle cx="10" cy="10" r="1" />
          <circle cx="30" cy="15" r="0.8" />
          <circle cx="50" cy="10" r="1" />

          <circle cx="15" cy="30" r="1" />
          <circle cx="35" cy="35" r="0.8" />
          <circle cx="55" cy="30" r="1" />

          <circle cx="10" cy="50" r="1" />
          <circle cx="30" cy="55" r="0.8" />
          <circle cx="50" cy="50" r="1" />
        </g>
      </svg>
    </div>
  )
}

