"use client"

import React from 'react'
import { cn } from '@/lib/utils'

export interface GildedCornerBracketsProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  inset?: string // e.g. "inset-1" or "inset-1.5"
}

export function GildedCornerBrackets({
  size = 'md',
  className,
  inset = 'inset-1',
}: GildedCornerBracketsProps) {
  const pixelSize = {
    sm: 18,
    md: 26,
    lg: 34,
  }[size]

  // Ornate medieval corner L-bracket with rivet and filigree scroll
  const CornerSvg = ({ flipX = false, flipY = false }: { flipX?: boolean; flipY?: boolean }) => (
    <svg
      viewBox="0 0 32 32"
      width={pixelSize}
      height={pixelSize}
      className={cn(
        "drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] opacity-90",
        flipX && "-scale-x-100",
        flipY && "-scale-y-100"
      )}
      style={{
        transformOrigin: "center",
      }}
    >
      <defs>
        <linearGradient id="goldBracketGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="40%" stopColor="#f59e0b" />
          <stop offset="70%" stopColor="#b45309" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>
      </defs>
      {/* Outer L-bracket shield contour */}
      <path
        d="M2 2 L20 2 C20 4, 18 6, 15 6 L6 6 L6 15 C6 18, 4 20, 2 20 Z"
        fill="url(#goldBracketGrad)"
        stroke="#451a03"
        strokeWidth="0.75"
      />
      {/* Filigree decorative curve */}
      <path
        d="M6 6 C10 10, 14 8, 18 18 C8 14, 10 10, 6 6 Z"
        fill="#92400e"
        opacity="0.8"
      />
      {/* Corner Rivet */}
      <circle cx="5" cy="5" r="1.8" fill="#fef08a" stroke="#78350f" strokeWidth="0.5" />
      <circle cx="15" cy="3.5" r="1.2" fill="#d97706" />
      <circle cx="3.5" cy="15" r="1.2" fill="#d97706" />
    </svg>
  )

  return (
    <div className={cn("absolute pointer-events-none select-none z-15", inset, className)} aria-hidden="true">
      {/* Top-Left */}
      <div className="absolute top-0 left-0">
        <CornerSvg />
      </div>

      {/* Top-Right */}
      <div className="absolute top-0 right-0">
        <CornerSvg flipX />
      </div>

      {/* Bottom-Left */}
      <div className="absolute bottom-0 left-0">
        <CornerSvg flipY />
      </div>

      {/* Bottom-Right */}
      <div className="absolute bottom-0 right-0">
        <CornerSvg flipX flipY />
      </div>
    </div>
  )
}
