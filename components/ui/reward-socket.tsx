"use client"

import React from 'react'
import { cn } from '@/lib/utils'

export interface RewardSocketProps {
  type?: 'gold' | 'xp' | 'essence' | 'item' | 'generic'
  amount: number | string
  label?: string
  icon?: React.ReactNode
  size?: 'sm' | 'md'
  className?: string
}

export function RewardSocket({
  type = 'generic',
  amount,
  label,
  icon,
  size = 'sm',
  className,
}: RewardSocketProps) {
  const config = {
    gold: {
      text: 'text-amber-300',
      border: 'border-amber-700/60 hover:border-amber-500/80',
      glow: 'group-hover:shadow-[0_0_8px_rgba(245,158,11,0.3)]',
      defaultLabel: 'gold',
      defaultIcon: '🪙',
    },
    xp: {
      text: 'text-blue-300',
      border: 'border-blue-700/60 hover:border-blue-500/80',
      glow: 'group-hover:shadow-[0_0_8px_rgba(59,130,246,0.3)]',
      defaultLabel: 'exp',
      defaultIcon: '⚡',
    },
    essence: {
      text: 'text-emerald-300',
      border: 'border-emerald-700/60 hover:border-emerald-500/80',
      glow: 'group-hover:shadow-[0_0_8px_rgba(16,185,129,0.3)]',
      defaultLabel: 'essence',
      defaultIcon: '🧪',
    },
    item: {
      text: 'text-purple-300',
      border: 'border-purple-700/60 hover:border-purple-500/80',
      glow: 'group-hover:shadow-[0_0_8px_rgba(168,85,247,0.3)]',
      defaultLabel: 'item',
      defaultIcon: '💎',
    },
    generic: {
      text: 'text-zinc-300',
      border: 'border-zinc-700/60 hover:border-zinc-500/80',
      glow: 'group-hover:shadow-[0_0_8px_rgba(255,255,255,0.1)]',
      defaultLabel: '',
      defaultIcon: '✦',
    },
  }[type]

  const displayLabel = label ?? config.defaultLabel
  const displayIcon = icon ?? config.defaultIcon

  return (
    <div
      className={cn(
        "group relative inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#0a0704] border shadow-[inset_0_2px_4px_rgba(0,0,0,0.85)] select-none transition-all duration-300",
        config.border,
        config.glow,
        size === 'sm' ? "text-[11px] h-6" : "text-xs h-7 px-2.5",
        className
      )}
    >
      {/* Antique inset corner accents */}
      <div className="absolute -top-0.5 -left-0.5 w-1 h-1 rounded-full bg-[#8c6d48]/80 pointer-events-none" />
      <div className="absolute -top-0.5 -right-0.5 w-1 h-1 rounded-full bg-[#8c6d48]/80 pointer-events-none" />
      <div className="absolute -bottom-0.5 -left-0.5 w-1 h-1 rounded-full bg-[#8c6d48]/80 pointer-events-none" />
      <div className="absolute -bottom-0.5 -right-0.5 w-1 h-1 rounded-full bg-[#8c6d48]/80 pointer-events-none" />

      {/* Icon */}
      <span className="text-xs leading-none shrink-0 drop-shadow-sm">
        {displayIcon}
      </span>

      {/* Amount and Label */}
      <span className={cn("font-serif font-bold tracking-tight", config.text)}>
        {amount}{" "}
        {displayLabel && (
          <span className="text-[9px] font-sans font-normal opacity-80 lowercase">
            {displayLabel}
          </span>
        )}
      </span>
    </div>
  )
}
