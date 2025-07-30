"use client"

import { cn } from "@/lib/utils"
import { Loader2, Sword, Shield, Crown, Star } from "lucide-react"
import { useState, useEffect } from "react"

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'sword' | 'shield' | 'crown' | 'star'
  text?: string
  className?: string
  showText?: boolean
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12'
}

const iconMap = {
  default: Loader2,
  sword: Sword,
  shield: Shield,
  crown: Crown,
  star: Star
}

export function LoadingSpinner({ 
  size = 'md', 
  variant = 'default', 
  text = 'Loading...',
  className,
  showText = true
}: LoadingSpinnerProps) {
  const [dots, setDots] = useState('')

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.')
    }, 500)

    return () => clearInterval(interval)
  }, [])

  const Icon = iconMap[variant]

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div className="relative">
        {/* Main spinning icon */}
        <Icon 
          className={cn(
            "animate-spin text-amber-500",
            sizeClasses[size]
          )} 
        />
        
        {/* Glow effect */}
        <div className={cn(
          "absolute inset-0 rounded-full bg-amber-500/20 blur-sm animate-pulse",
          sizeClasses[size]
        )} />
        
        {/* Ring effect for certain variants */}
        {variant !== 'default' && (
          <div className={cn(
            "absolute inset-0 rounded-full border-2 border-amber-500/30 animate-spin",
            sizeClasses[size]
          )} style={{ animationDirection: 'reverse', animationDuration: '2s' }} />
        )}
      </div>
      
      {showText && (
        <div className="text-center">
          <p className="text-sm text-amber-400 font-medium">
            {text}{dots}
          </p>
          <div className="mt-1 h-1 w-16 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full animate-pulse" />
          </div>
        </div>
      )}
    </div>
  )
}

// Enhanced loading states for different contexts
export function QuestLoadingSpinner({ className }: { className?: string }) {
  return (
    <LoadingSpinner 
      variant="sword" 
      size="lg" 
      text="Preparing your quest"
      className={className}
    />
  )
}

export function KingdomLoadingSpinner({ className }: { className?: string }) {
  return (
    <LoadingSpinner 
      variant="crown" 
      size="lg" 
      text="Loading your kingdom"
      className={className}
    />
  )
}

export function AchievementLoadingSpinner({ className }: { className?: string }) {
  return (
    <LoadingSpinner 
      variant="star" 
      size="lg" 
      text="Unlocking achievements"
      className={className}
    />
  )
}

export function InventoryLoadingSpinner({ className }: { className?: string }) {
  return (
    <LoadingSpinner 
      variant="shield" 
      size="lg" 
      text="Loading inventory"
      className={className}
    />
  )
}

// Skeleton loading component
export function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse", className)}>
      <div className="h-4 bg-gray-700 rounded mb-2" />
      <div className="h-4 bg-gray-700 rounded mb-2 w-3/4" />
      <div className="h-4 bg-gray-700 rounded w-1/2" />
    </div>
  )
}

// Card skeleton
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn(
      "bg-gradient-to-br from-gray-900/90 to-gray-800/90 border border-amber-800/20 rounded-lg p-4",
      className
    )}>
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 bg-gray-700 rounded-lg animate-pulse" />
        <div className="flex-1">
          <div className="h-4 bg-gray-700 rounded mb-2" />
          <div className="h-3 bg-gray-700 rounded w-3/4" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-2 bg-gray-700 rounded" />
        <div className="h-2 bg-gray-700 rounded w-2/3" />
      </div>
    </div>
  )
}

// Grid skeleton for multiple cards
export function GridSkeleton({ count = 6, className }: { count?: number, className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <CardSkeleton key={index} />
      ))}
    </div>
  )
} 