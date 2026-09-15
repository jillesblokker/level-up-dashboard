"use client"

import React from 'react'
import { cn } from '@/lib/utils'

export interface BookmarkTabProps {
  isActive?: boolean
  onClick?: () => void
  icon: React.ReactNode
  label?: string
  variant?: 'leather' | 'crimson' | 'sapphire' | 'emerald'
  side?: 'left' | 'right'
  className?: string
  title?: string
}

export function BookmarkTab({
  isActive = false,
  onClick,
  icon,
  label,
  variant = 'leather',
  side = 'left',
  className,
  title,
}: BookmarkTabProps) {
  const variantStyles = {
    leather: {
      active: 'from-[#5c3e21] via-[#784f2b] to-[#3d2714] border-[#d97706] text-amber-200 shadow-[0_4px_12px_rgba(0,0,0,0.8),0_0_8px_rgba(245,158,11,0.4)]',
      inactive: 'from-[#291a0e] via-[#3a2514] to-[#1c1108] border-[#574029] text-zinc-400 hover:text-amber-300 hover:from-[#3a2514]',
    },
    crimson: {
      active: 'from-[#881337] via-[#9f1239] to-[#4c0519] border-[#f43f5e] text-rose-100 shadow-[0_4px_12px_rgba(0,0,0,0.8),0_0_8px_rgba(244,63,94,0.4)]',
      inactive: 'from-[#4c0519] via-[#5c0b24] to-[#26020c] border-[#881337] text-zinc-400 hover:text-rose-200',
    },
    sapphire: {
      active: 'from-[#1e3a8a] via-[#2563eb] to-[#0f172a] border-[#60a5fa] text-blue-100 shadow-[0_4px_12px_rgba(0,0,0,0.8),0_0_8px_rgba(59,130,246,0.4)]',
      inactive: 'from-[#0f172a] via-[#1e293b] to-[#080d1a] border-[#1e3a8a] text-zinc-400 hover:text-blue-200',
    },
    emerald: {
      active: 'from-[#065f46] via-[#059669] to-[#022c22] border-[#34d399] text-emerald-100 shadow-[0_4px_12px_rgba(0,0,0,0.8),0_0_8px_rgba(52,211,153,0.4)]',
      inactive: 'from-[#022c22] via-[#064e3b] to-[#011711] border-[#065f46] text-zinc-400 hover:text-emerald-200',
    },
  }[variant]

  const isLeft = side === 'left'

  return (
    <button
      type="button"
      onClick={onClick}
      title={title || label}
      aria-label={title || label}
      className={cn(
        "relative flex items-center justify-center transition-all duration-300 select-none group focus:outline-none",
        isLeft
          ? "rounded-l-lg border-y border-l -mr-px"
          : "rounded-r-lg border-y border-r -ml-px",
        "bg-gradient-to-r p-2 sm:p-2.5",
        isActive
          ? cn("z-20 scale-105", variantStyles.active)
          : cn("z-10 opacity-80 hover:opacity-100 hover:scale-102", variantStyles.inactive),
        className
      )}
    >
      {/* Debossed Stitched Inset Border */}
      <div
        className={cn(
          "absolute pointer-events-none border-dashed opacity-40",
          isLeft ? "inset-y-1 left-1 right-0 border-y border-l border-amber-300/40 rounded-l-md" : "inset-y-1 right-1 left-0 border-y border-r border-amber-300/40 rounded-r-md"
        )}
      />

      {/* Icon */}
      <div className="relative z-10 flex items-center justify-center">
        {icon}
      </div>

      {/* Optional Label (shown on larger screens or desktop) */}
      {label && (
        <span className="relative z-10 ml-1.5 text-[10px] font-serif font-bold tracking-wider hidden md:inline-block">
          {label}
        </span>
      )}
    </button>
  )
}
