"use client"

import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"

interface MedievalLoadingProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'spinner' | 'pulse' | 'dots' | 'sword' | 'shield' | 'crown'
  text?: string
  className?: string
}

export function MedievalLoading({ 
  size = 'md', 
  variant = 'spinner', 
  text,
  className 
}: MedievalLoadingProps) {
  const [dots, setDots] = useState('')

  useEffect(() => {
    if (variant === 'dots') {
      const interval = setInterval(() => {
        setDots(prev => prev.length >= 3 ? '' : prev + '.')
      }, 500)
      return () => clearInterval(interval)
    }
    return undefined
  }, [variant])

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  }

  const renderLoader = () => {
    switch (variant) {
      case 'spinner':
        return (
          <div className={cn(
            "border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin",
            sizeClasses[size]
          )} />
        )
      
      case 'pulse':
        return (
          <div className={cn(
            "bg-amber-500 rounded-full animate-pulse",
            sizeClasses[size]
          )} />
        )
      
      case 'dots':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className={cn(
                  "bg-amber-500 rounded-full animate-bounce",
                  size === 'sm' ? 'w-1 h-1' : size === 'md' ? 'w-2 h-2' : 'w-3 h-3'
                )}
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        )
      
      case 'sword':
        return (
          <div className={cn(
            "relative",
            sizeClasses[size]
          )}>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-1 h-full bg-gradient-to-b from-amber-400 to-amber-600 rounded-full animate-pulse" />
            </div>
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-amber-500 rounded-full animate-ping" />
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-3 h-1 bg-amber-600 rounded" />
          </div>
        )
      
      case 'shield':
        return (
          <div className={cn(
            "relative",
            sizeClasses[size]
          )}>
            <div className="w-full h-full bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg animate-pulse">
              <div className="absolute inset-2 border-2 border-amber-200 rounded-lg" />
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-amber-200 rounded-full animate-ping" />
            </div>
          </div>
        )
      
      case 'crown':
        return (
          <div className={cn(
            "relative",
            sizeClasses[size]
          )}>
            <div className="w-full h-3/4 bg-gradient-to-b from-amber-400 to-amber-600 rounded-t-lg animate-pulse">
              <div className="absolute -top-1 left-1/4 w-1 h-2 bg-amber-500 rounded-full animate-bounce" />
              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-3 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="absolute -top-1 right-1/4 w-1 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className={cn(
      "flex flex-col items-center justify-center space-y-2",
      className
    )}>
      {renderLoader()}
      {text && (
        <p className={cn(
          "text-amber-400 font-medium animate-pulse",
          textSizeClasses[size]
        )}>
          {text}{variant === 'dots' ? dots : ''}
        </p>
      )}
    </div>
  )
}

// Medieval-themed skeleton loader
export function MedievalSkeleton({ 
  className,
  lines = 3 
}: { 
  className?: string
  lines?: number 
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-4 bg-gradient-to-r from-amber-900/20 via-amber-800/30 to-amber-900/20 rounded-lg animate-pulse",
            i === lines - 1 && "w-3/4" // Last line is shorter
          )}
        />
      ))}
    </div>
  )
}

// Medieval-themed progress bar
export function MedievalProgressBar({ 
  progress, 
  max = 100, 
  className,
  showText = true,
  variant = 'default'
}: { 
  progress: number
  max?: number
  className?: string
  showText?: boolean
  variant?: 'default' | 'gold' | 'xp' | 'health'
}) {
  const percentage = Math.min((progress / max) * 100, 100)

  const variantStyles = {
    default: "bg-gradient-to-r from-amber-500 to-amber-600",
    gold: "bg-gradient-to-r from-yellow-400 to-yellow-600",
    xp: "bg-gradient-to-r from-blue-400 to-blue-600",
    health: "bg-gradient-to-r from-green-400 to-green-600"
  }

  return (
    <div className={cn("space-y-2", className)}>
      {showText && (
        <div className="flex justify-between text-sm text-amber-400">
          <span>Progress</span>
          <span>{progress}/{max}</span>
        </div>
      )}
      <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden border border-amber-800/30">
        <div 
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out relative",
            variantStyles[variant]
          )}
          style={{ width: `${percentage}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
        </div>
      </div>
    </div>
  )
}

// Medieval-themed shimmer effect
export function MedievalShimmer({ 
  className,
  children 
}: { 
  className?: string
  children: React.ReactNode 
}) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      {children}
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-amber-500/20 to-transparent animate-shimmer" />
    </div>
  )
}
