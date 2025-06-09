interface SpecialTileProps {
  className?: string
  ariaLabel?: string
  onClick?: () => void
}

export function SpecialTile({ className, ariaLabel, onClick }: SpecialTileProps) {
  return (
    <div 
      className={`w-full h-full relative ${className || ""}`} 
      aria-label={ariaLabel || "Special tile"} 
      onClick={onClick}
    >
      <svg viewBox="0 0 64 64" className="w-full h-full">
        {/* Green background (changed from purple) */}
        <rect width="64" height="64" fill="#4CAF50" />
        {/* Temple base platform */}
        <rect x="8" y="8" width="48" height="48" fill="#A67C52" stroke="#5D4037" strokeWidth="1" />
        {/* Temple steps */}
        <rect x="12" y="12" width="40" height="40" fill="#C19A6B" stroke="#5D4037" strokeWidth="0.5" />
        <rect x="16" y="16" width="32" height="32" fill="#D7B899" stroke="#5D4037" strokeWidth="0.5" />
        {/* Temple main structure */}
        <rect x="20" y="20" width="24" height="24" fill="#E6CCAB" stroke="#5D4037" strokeWidth="0.5" />
        {/* Temple roof */}
        <polygon points="20,20 32,12 44,20" fill="#8B4513" stroke="#5D4037" strokeWidth="0.5" />
        {/* Temple entrance */}
        <rect x="28" y="36" width="8" height="8" fill="#5D4037" />
        {/* Temple columns */}
        <rect x="22" y="24" width="2" height="12" fill="#8B4513" />
        <rect x="40" y="24" width="2" height="12" fill="#8B4513" />
        {/* Temple decorative elements */}
        <rect x="24" y="22" width="16" height="2" fill="#8B4513" />
        <circle cx="32" cy="28" r="4" fill="#FFD700" /> {/* Golden altar or artifact */}
        {/* Surrounding decorative elements */}
        <circle cx="12" cy="12" r="2" fill="#7D5A44" />
        <circle cx="52" cy="12" r="2" fill="#7D5A44" />
        <circle cx="12" cy="52" r="2" fill="#7D5A44" />
        <circle cx="52" cy="52" r="2" fill="#7D5A44" />
        {/* Small plants or decorations */}
        <path d="M8,30 C10,28 12,30 10,32 Z" fill="#388E3C" />
        <path d="M54,30 C56,28 58,30 56,32 Z" fill="#388E3C" />
        <path d="M30,8 C32,6 34,8 32,10 Z" fill="#388E3C" />
        <path d="M30,54 C32,52 34,54 32,56 Z" fill="#388E3C" />
      </svg>
    </div>
  )
}

