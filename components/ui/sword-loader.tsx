"use client"

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Sparkles } from 'lucide-react'

export interface SwordLoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen' | undefined
  label?: string | undefined
  sublabel?: string | undefined
  className?: string | undefined
  variant?: 'amber' | 'blue' | undefined
}

export function SwordLoader({
  size = 'md',
  label,
  sublabel,
  className,
  variant = 'amber'
}: SwordLoaderProps) {
  const [mounted, setMounted] = useState(false)
  const isFullscreen = size === 'fullscreen'

  useEffect(() => {
    setMounted(true)
  }, [])

  // Dimensions based on size prop - enlarged and prominent
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-36 h-36',
    xl: 'w-48 h-48',
    fullscreen: 'w-48 h-48 sm:w-56 sm:h-56'
  }[size]

  const glowColor = variant === 'blue' 
    ? 'drop-shadow-[0_0_20px_rgba(59,130,246,0.7)] drop-shadow-[0_0_40px_rgba(37,99,235,0.4)]'
    : 'drop-shadow-[0_0_20px_rgba(245,158,11,0.7)] drop-shadow-[0_0_40px_rgba(217,119,6,0.4)]'

  const haloBg = variant === 'blue'
    ? 'bg-blue-500/20'
    : 'bg-amber-500/20'

  const titleColor = variant === 'blue'
    ? 'text-blue-300'
    : 'text-amber-200'

  const content = (
    <div className={cn("flex flex-col items-center justify-center relative select-none", className)}>
      {/* Mystical glowing halo behind the sword */}
      <div className={cn("absolute rounded-full blur-3xl animate-pulse pointer-events-none", haloBg, sizeClasses)} />

      {/* Sweeping Cartoony Medieval Sword */}
      <div className={cn("relative z-10 flex items-center justify-center", sizeClasses)}>
        <div className="sword-sweeping w-full h-full relative flex items-center justify-center">
          <Image
            src="/images/sword-spinner-upright.webp?v=cartoony"
            alt="Cartoony fantasy sword loading indicator"
            width={320}
            height={320}
            priority
            className={cn(
              "object-contain w-full h-full transform-gpu transition-all select-none pointer-events-none",
              glowColor
            )}
          />
        </div>
      </div>

      {/* Decorative sparkles for magic feel */}
      {(size === 'lg' || size === 'xl' || isFullscreen) && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-amber-300/60 absolute -top-3 -right-5 animate-bounce" style={{ animationDuration: '1.8s' }} />
          <Sparkles className="w-5 h-5 text-amber-200/50 absolute -bottom-3 -left-4 animate-pulse" style={{ animationDuration: '2.2s' }} />
        </div>
      )}

      {/* Informative labels */}
      {(label || sublabel) && (
        <div className="mt-6 text-center space-y-2 relative z-10 max-w-sm px-4 animate-in fade-in duration-300">
          {label && (
            <h3 className={cn("font-serif font-bold text-lg sm:text-xl tracking-wide", titleColor)}>
              {label}
            </h3>
          )}
          {sublabel && (
            <p className="text-xs sm:text-sm text-zinc-300/80 font-serif italic leading-relaxed">
              {sublabel}
            </p>
          )}
        </div>
      )}

      {/* Global CSS for the sweeping cartoony sword pendulum rotation */}
      <style jsx global>{`
        @keyframes sword-sweep-anim {
          0% {
            transform: rotate(-32deg);
          }
          50% {
            transform: rotate(32deg);
          }
          100% {
            transform: rotate(-32deg);
          }
        }
        .sword-sweeping {
          transform-origin: 50% 79%;
          animation: sword-sweep-anim 2.2s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
          will-change: transform;
        }
      `}</style>
    </div>
  )

  // When fullscreen, ALWAYS portal to document.body with maximum z-index (z-[9999999])
  // so it is NEVER behind any modal, backdrop, sheet, or layout element!
  if (isFullscreen) {
    if (!mounted || typeof document === 'undefined') return null

    return createPortal(
      <div 
        className="fixed inset-0 z-[9999999] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in duration-150 select-none pointer-events-auto"
        role="status"
        aria-live="polite"
        aria-label={label || "Loading page"}
      >
        {content}
      </div>,
      document.body
    )
  }

  return content
}
