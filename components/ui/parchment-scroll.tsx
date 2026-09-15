"use client"

import React from 'react'
import { cn } from '@/lib/utils'

export interface ParchmentScrollProps {
  children: React.ReactNode
  variant?: 'parchment' | 'dark'
  className?: string
  contentClassName?: string
}

export function ParchmentScroll({
  children,
  variant = 'dark',
  className,
  contentClassName,
}: ParchmentScrollProps) {
  const isDark = variant === 'dark'

  return (
    <div className={cn("relative w-full flex items-center select-none", className)}>
      {/* Left Rolled Scroll Spindle / Finial */}
      <div className="relative shrink-0 flex flex-col items-center justify-center z-10 -mr-2">
        {/* Top finial knob */}
        <div className="w-2.5 h-2 rounded-t-full bg-gradient-to-b from-[#b45309] to-[#78350f] border border-[#fef08a]/60 shadow-sm" />
        {/* Vertical wooden spindle cylinder */}
        <div className="w-3.5 h-16 sm:h-20 rounded-sm bg-gradient-to-r from-[#291b10] via-[#5c3e21] to-[#1c120a] border border-[#8c6d48]/80 shadow-[0_4px_10px_rgba(0,0,0,0.8)] flex flex-col justify-between py-1">
          <div className="w-full h-1 bg-[#d97706]/40" />
          <div className="w-full h-1 bg-[#d97706]/40" />
        </div>
        {/* Bottom finial knob */}
        <div className="w-2.5 h-2 rounded-b-full bg-gradient-to-t from-[#b45309] to-[#78350f] border border-[#fef08a]/60 shadow-sm" />
      </div>

      {/* Main Parchment Scroll Body */}
      <div
        className={cn(
          "flex-1 relative rounded-lg border-y-2 border-[#8c6d48]/70 shadow-[0_8px_24px_rgba(0,0,0,0.85)] px-5 py-3 overflow-hidden",
          isDark
            ? "bg-gradient-to-r from-[#171109] via-[#21180d] to-[#171109] text-amber-100"
            : "bg-gradient-to-r from-[#fef3c7] via-[#fde68a] to-[#fef3c7] text-[#451a03]"
        )}
      >
        {/* Top and Bottom Scroll Crease Lines */}
        <div className="absolute inset-x-2 top-0.5 h-px bg-gradient-to-r from-transparent via-[#d97706]/50 to-transparent pointer-events-none" />
        <div className="absolute inset-x-2 bottom-0.5 h-px bg-gradient-to-r from-transparent via-[#d97706]/50 to-transparent pointer-events-none" />

        {/* Content Container */}
        <div className={cn("relative z-10", contentClassName)}>
          {children}
        </div>
      </div>

      {/* Right Rolled Scroll Spindle / Finial */}
      <div className="relative shrink-0 flex flex-col items-center justify-center z-10 -ml-2">
        {/* Top finial knob */}
        <div className="w-2.5 h-2 rounded-t-full bg-gradient-to-b from-[#b45309] to-[#78350f] border border-[#fef08a]/60 shadow-sm" />
        {/* Vertical wooden spindle cylinder */}
        <div className="w-3.5 h-16 sm:h-20 rounded-sm bg-gradient-to-r from-[#1c120a] via-[#5c3e21] to-[#291b10] border border-[#8c6d48]/80 shadow-[0_4px_10px_rgba(0,0,0,0.8)] flex flex-col justify-between py-1">
          <div className="w-full h-1 bg-[#d97706]/40" />
          <div className="w-full h-1 bg-[#d97706]/40" />
        </div>
        {/* Bottom finial knob */}
        <div className="w-2.5 h-2 rounded-b-full bg-gradient-to-t from-[#b45309] to-[#78350f] border border-[#fef08a]/60 shadow-sm" />
      </div>
    </div>
  )
}
