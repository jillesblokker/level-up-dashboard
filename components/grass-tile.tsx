"use client"

interface GrassTileProps {
  className?: string
  ariaLabel?: string
  onClick?: () => void
}

export function GrassTile({ className, ariaLabel, onClick }: GrassTileProps) {
  return (
    <div
      className={`w-full h-full relative ${className || ""} cursor-pointer`}
      aria-label={ariaLabel || "Grass tile"}
      role="img"
      onClick={onClick}
    >
      <svg viewBox="0 0 64 64" className="w-full h-full">
        {/* Vibrant green background */}
        <rect width="64" height="64" fill="#4CAF50" />

        {/* Grass texture with different shades */}
        <g fill="#388E3C">
          {/* Random grass tufts */}
          <path d="M5,10 C7,5 10,8 8,12 C13,10 15,15 10,17 C15,20 10,25 7,22 Z" />
          <path d="M20,15 C22,10 25,13 23,17 C28,15 30,20 25,22 C30,25 25,30 22,27 Z" />
          <path d="M40,10 C42,5 45,8 43,12 C48,10 50,15 45,17 C50,20 45,25 42,22 Z" />
          <path d="M55,15 C57,10 60,13 58,17 C63,15 65,20 60,22 C65,25 60,30 57,27 Z" />

          <path d="M10,35 C12,30 15,33 13,37 C18,35 20,40 15,42 C20,45 15,50 12,47 Z" />
          <path d="M30,40 C32,35 35,38 33,42 C38,40 40,45 35,47 C40,50 35,55 32,52 Z" />
          <path d="M50,35 C52,30 55,33 53,37 C58,35 60,40 55,42 C60,45 55,50 52,47 Z" />

          <path d="M15,55 C17,50 20,53 18,57 C23,55 25,60 20,62 C25,65 20,70 17,67 Z" />
          <path d="M35,50 C37,45 40,48 38,52 C43,50 45,55 40,57 C45,60 40,65 37,62 Z" />
          <path d="M55,55 C57,50 60,53 58,57 C63,55 65,60 60,62 C65,65 60,70 57,67 Z" />
        </g>

        {/* Lighter grass highlights */}
        <g fill="#66BB6A" opacity="0.7">
          <circle cx="10" cy="10" r="2" />
          <circle cx="25" cy="15" r="1.5" />
          <circle cx="40" cy="8" r="2" />
          <circle cx="55" cy="20" r="1.5" />

          <circle cx="15" cy="30" r="2" />
          <circle cx="35" cy="35" r="1.5" />
          <circle cx="50" cy="30" r="2" />

          <circle cx="20" cy="50" r="2" />
          <circle cx="40" cy="55" r="1.5" />
          <circle cx="60" cy="45" r="2" />
        </g>

        {/* Small flowers or details */}
        <g fill="#FFF59D">
          <circle cx="15" cy="15" r="0.8" />
          <circle cx="45" cy="25" r="0.8" />
          <circle cx="25" cy="45" r="0.8" />
          <circle cx="55" cy="50" r="0.8" />
        </g>
      </svg>
    </div>
  )
}

