"use client"

import React from "react"
import { cn } from "@/lib/utils"

export type HeraldicCategory = 
  | 'might' 
  | 'knowledge' 
  | 'honor' 
  | 'castle' 
  | 'craft' 
  | 'vitality' 
  | 'wellness' 
  | 'exploration' 
  | 'wealth' 
  | 'conquest'

interface HeraldicShieldProps {
  category: HeraldicCategory | string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showLabel?: boolean
}

const HERALDIC_CONFIG: Record<string, {
  label: string
  primaryColor: string
  secondaryColor: string
  borderColor: string
  glowColor: string
  icon: string
  svgSymbol: React.ReactNode
}> = {
  might: {
    label: 'Might',
    primaryColor: '#991b1b', // red-800
    secondaryColor: '#f59e0b', // amber-500
    borderColor: '#7f1d1d',
    glowColor: 'rgba(239,68,68,0.5)',
    icon: '⚔️',
    svgSymbol: (
      <path d="M7 17L17 7M17 7H11M17 7V13M7 7L17 17M7 7H13M7 7V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    )
  },
  knowledge: {
    label: 'Knowledge',
    primaryColor: '#1e3a8a', // blue-900
    secondaryColor: '#38bdf8', // sky-400
    borderColor: '#1e40af',
    glowColor: 'rgba(56,189,248,0.5)',
    icon: '📚',
    svgSymbol: (
      <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    )
  },
  honor: {
    label: 'Honor',
    primaryColor: '#065f46', // emerald-800
    secondaryColor: '#fbbf24', // amber-400
    borderColor: '#047857',
    glowColor: 'rgba(52,211,153,0.5)',
    icon: '🛡️',
    svgSymbol: (
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    )
  },
  castle: {
    label: 'Castle',
    primaryColor: '#581c87', // purple-900
    secondaryColor: '#c084fc', // purple-400
    borderColor: '#6b21a8',
    glowColor: 'rgba(192,132,252,0.5)',
    icon: '🏰',
    svgSymbol: (
      <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0v-5a2 2 0 012-2h2a2 2 0 012 2v5m-6 0h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    )
  },
  craft: {
    label: 'Craft',
    primaryColor: '#9a3412', // orange-800
    secondaryColor: '#fb923c', // orange-400
    borderColor: '#c2410c',
    glowColor: 'rgba(251,146,60,0.5)',
    icon: '🔧',
    svgSymbol: (
      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.9 6.91a2.12 2.12 0 01-3-3l6.91-6.9a6 6 0 017.94-7.94l-3.76 3.76z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    )
  },
  vitality: {
    label: 'Vitality',
    primaryColor: '#831843', // pink-900
    secondaryColor: '#f472b6', // pink-400
    borderColor: '#9d174d',
    glowColor: 'rgba(244,114,182,0.5)',
    icon: '❤️',
    svgSymbol: (
      <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    )
  },
  wellness: {
    label: 'Wellness',
    primaryColor: '#115e59', // teal-800
    secondaryColor: '#2dd4bf', // teal-400
    borderColor: '#0f766e',
    glowColor: 'rgba(45,212,191,0.5)',
    icon: '🌙',
    svgSymbol: (
      <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    )
  },
  exploration: {
    label: 'Exploration',
    primaryColor: '#854d0e', // yellow-800
    secondaryColor: '#facc15', // yellow-400
    borderColor: '#a16207',
    glowColor: 'rgba(250,204,21,0.5)',
    icon: '🗺️',
    svgSymbol: (
      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z M16.24 7.76L14.12 14.12L7.76 16.24L9.88 9.88L16.24 7.76Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    )
  },
  wealth: {
    label: 'Wealth',
    primaryColor: '#78350f', // amber-900
    secondaryColor: '#f59e0b', // amber-500
    borderColor: '#b45309',
    glowColor: 'rgba(245,158,11,0.5)',
    icon: '💰',
    svgSymbol: (
      <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V6m0 12v-2m0 0c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    )
  },
  conquest: {
    label: 'Conquest',
    primaryColor: '#450a0a', // red-950
    secondaryColor: '#ef4444', // red-500
    borderColor: '#991b1b',
    glowColor: 'rgba(239,68,68,0.6)',
    icon: '👑',
    svgSymbol: (
      <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    )
  }
}

export function HeraldicShield({ category, size = 'md', className, showLabel = false }: HeraldicShieldProps) {
  const catKey = String(category || 'might').toLowerCase()
  const config = HERALDIC_CONFIG[catKey] || HERALDIC_CONFIG['might']

  const sizeClasses = {
    sm: 'w-6 h-7 text-[10px]',
    md: 'w-8 h-9 text-xs',
    lg: 'w-10 h-11 text-sm',
    xl: 'w-12 h-14 text-base',
  }

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <div 
        className={cn(
          "relative flex items-center justify-center transition-all duration-300 group hover:scale-110 shrink-0",
          sizeClasses[size]
        )}
        title={`${config.label} Category`}
      >
        {/* SVG Illuminated Shield Frame */}
        <svg 
          viewBox="0 0 40 48" 
          className="w-full h-full drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer Shield Border */}
          <path 
            d="M20 44C20 44 36 36 36 20V6L20 2L4 6V20C4 36 20 44 20 44Z" 
            fill={config.primaryColor}
            stroke="#fef08a" 
            strokeWidth="1.5"
          />

          {/* Inner Shield Accent */}
          <path 
            d="M20 40C20 40 32 33 32 18V8L20 4L8 8V18C8 33 20 40 20 40Z" 
            fill="none"
            stroke={config.secondaryColor} 
            strokeWidth="1"
            strokeDasharray="2 1"
            opacity="0.8"
          />

          {/* Central Line Decor */}
          <line x1="20" y1="5" x2="20" y2="39" stroke={config.secondaryColor} strokeWidth="0.5" opacity="0.4" />
          <line x1="7" y1="18" x2="33" y2="18" stroke={config.secondaryColor} strokeWidth="0.5" opacity="0.4" />
        </svg>

        {/* Central Heraldic Symbol */}
        <div className="absolute inset-0 flex items-center justify-center text-amber-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
          <span className="scale-75 select-none">{config.icon}</span>
        </div>
      </div>

      {showLabel && (
        <span className="font-serif font-bold text-xs text-amber-200 tracking-wide">
          {config.label}
        </span>
      )}
    </div>
  )
}
