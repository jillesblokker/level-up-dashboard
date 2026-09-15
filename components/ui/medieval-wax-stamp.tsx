"use client"

import React from 'react'
import { cn } from '@/lib/utils'

export interface MedievalWaxStampProps {
  text?: string
  subtext?: string
  variant?: 'crimson' | 'gold' | 'emerald'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  animate?: boolean
}

export function MedievalWaxStamp({
  text = "Quest complete",
  subtext,
  variant = 'crimson',
  size = 'md',
  className,
  animate = true,
}: MedievalWaxStampProps) {
  const variantStyles = {
    crimson: {
      border: 'border-rose-700/80',
      text: 'text-rose-400/90',
      bg: 'bg-rose-950/20',
      glow: 'shadow-[0_0_15px_rgba(225,29,72,0.25)]',
      svgStroke: '#be123c',
      svgFill: '#f43f5e',
    },
    gold: {
      border: 'border-amber-600/80',
      text: 'text-amber-300/90',
      bg: 'bg-amber-950/20',
      glow: 'shadow-[0_0_15px_rgba(245,158,11,0.25)]',
      svgStroke: '#d97706',
      svgFill: '#fbbf24',
    },
    emerald: {
      border: 'border-emerald-600/80',
      text: 'text-emerald-300/90',
      bg: 'bg-emerald-950/20',
      glow: 'shadow-[0_0_15px_rgba(16,185,129,0.25)]',
      svgStroke: '#059669',
      svgFill: '#34d399',
    },
  }[variant]

  const sizeStyles = {
    sm: 'w-20 h-20 text-[8px]',
    md: 'w-24 h-24 text-[9px]',
    lg: 'w-28 h-28 text-[11px]',
  }[size]

  return (
    <div
      className={cn(
        "relative rounded-full select-none pointer-events-none flex flex-col items-center justify-center p-2 text-center font-serif font-bold tracking-wider uppercase transition-transform -rotate-12",
        variantStyles.glow,
        sizeStyles,
        animate && "animate-in zoom-in-75 duration-300 ease-out",
        className
      )}
      aria-hidden="true"
    >
      {/* Outer Serrated / Notched Ink Ring */}
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 w-full h-full"
        style={{ opacity: 0.85 }}
      >
        <circle
          cx="50"
          cy="50"
          r="46"
          fill="none"
          stroke={variantStyles.svgStroke}
          strokeWidth="2.5"
          strokeDasharray="4 2 1 2"
        />
        <circle
          cx="50"
          cy="50"
          r="41"
          fill="none"
          stroke={variantStyles.svgStroke}
          strokeWidth="1"
          strokeDasharray="1 1"
          opacity="0.7"
        />
        <circle
          cx="50"
          cy="50"
          r="37"
          fill="none"
          stroke={variantStyles.svgStroke}
          strokeWidth="1.5"
        />
      </svg>

      {/* Center Crown Emblem */}
      <div className="relative z-10 flex flex-col items-center justify-center space-y-0.5">
        <svg
          viewBox="0 0 24 24"
          fill={variantStyles.svgFill}
          className={cn(
            "drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] opacity-90",
            size === 'sm' ? "w-4 h-4" : size === 'md' ? "w-5 h-5" : "w-6 h-6"
          )}
        >
          <path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5M19 19C19 19.6 18.6 20 18 20H6C5.4 20 5 19.6 5 19V17H19V19Z" />
        </svg>

        <span
          className={cn(
            "leading-tight font-black tracking-widest px-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]",
            variantStyles.text
          )}
        >
          {text}
        </span>

        {subtext ? (
          <span className="text-[7px] font-mono tracking-wider opacity-75">
            {subtext}
          </span>
        ) : (
          <span className="text-[7px] tracking-widest opacity-60">✦ ✦ ✦</span>
        )}
      </div>
    </div>
  )
}
