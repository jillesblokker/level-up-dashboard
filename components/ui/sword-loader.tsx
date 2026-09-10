"use client"

import React from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Sparkles } from 'lucide-react'

interface SwordLoaderProps {
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
  const isFullscreen = size === 'fullscreen'

  // Dimensions based on size prop
  const sizeClasses = {
    sm: 'w-14 h-14',
    md: 'w-24 h-24',
    lg: 'w-36 h-36',
    xl: 'w-48 h-48',
    fullscreen: 'w-44 h-44 sm:w-52 sm:h-52'
  }[size]

  const glowColor = variant === 'blue' 
    ? 'drop-shadow-[0_0_18px_rgba(59,130,246,0.6)] drop-shadow-[0_0_35px_rgba(37,99,235,0.3)]'
    : 'drop-shadow-[0_0_18px_rgba(245,158,11,0.6)] drop-shadow-[0_0_35px_rgba(217,119,6,0.3)]'

  const haloBg = variant === 'blue'
    ? 'bg-blue-500/15'
    : 'bg-amber-500/15'

  const titleColor = variant === 'blue'
    ? 'text-blue-300'
    : 'text-amber-200'

  const content = (
    <div className={cn("flex flex-col items-center justify-center relative select-none", className)}>
      {/* Mystical glowing halo behind the sword */}
      <div className={cn("absolute rounded-full blur-2xl animate-pulse pointer-events-none", haloBg, sizeClasses)} />

      {/* Sweeping Medieval Sword */}
      <div className={cn("relative z-10 flex items-center justify-center", sizeClasses)}>
        <div className="sword-sweeping w-full h-full relative flex items-center justify-center">
          <Image
            src="/images/sword-spinner-upright.png"
            alt="Medieval sword loading indicator"
            width={256}
            height={256}
            priority
            className={cn(
              "object-contain w-full h-full transform-gpu transition-all",
              glowColor
            )}
          />
        </div>
      </div>

      {/* Decorative sparkles */}
      {(size === 'lg' || size === 'xl' || isFullscreen) && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-amber-400/50 absolute -top-2 -right-4 animate-bounce" style={{ animationDuration: '2s' }} />
          <Sparkles className="w-4 h-4 text-amber-300/40 absolute -bottom-2 -left-3 animate-pulse" style={{ animationDuration: '2.5s' }} />
        </div>
      )}

      {/* Informative labels */}
      {(label || sublabel) && (
        <div className="mt-5 text-center space-y-1.5 relative z-10 max-w-sm px-4 animate-in fade-in duration-300">
          {label && (
            <h3 className={cn("font-serif font-bold text-base sm:text-lg tracking-wide", titleColor)}>
              {label}
            </h3>
          )}
          {sublabel && (
            <p className="text-xs text-zinc-400 font-serif italic leading-relaxed">
              {sublabel}
            </p>
          )}
        </div>
      )}

      {/* Global CSS for the sweeping sword pendulum rotation */}
      <style jsx global>{`
        @keyframes sword-sweep-anim {
          0% {
            transform: rotate(-30deg);
          }
          50% {
            transform: rotate(30deg);
          }
          100% {
            transform: rotate(-30deg);
          }
        }
        .sword-sweeping {
          transform-origin: 50% 80%;
          animation: sword-sweep-anim 2.2s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
          will-change: transform;
        }
      `}</style>
    </div>
  )

  if (isFullscreen) {
    return (
      <div 
        className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in duration-200"
        role="status"
        aria-live="polite"
        aria-label={label || "Loading page"}
      >
        {content}
      </div>
    )
  }

  return content
}
