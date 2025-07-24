import React from 'react'
import { Loader2, Skeleton } from 'lucide-react'
import { cn } from '@/lib/utils'

// Base loading spinner component
export function LoadingSpinner({ 
  size = "md", 
  label = "Loading",
  className = ""
}: { 
  size?: "sm" | "md" | "lg" | "xl"
  label?: string
  className?: string
}) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8", 
    lg: "h-12 w-12",
    xl: "h-16 w-16"
  }
  
  return (
    <div className={cn("flex items-center justify-center space-x-2", className)} role="status" aria-label={label}>
      <Loader2 className={cn("animate-spin text-amber-500", sizeClasses[size])} />
      <span className="sr-only">{label}</span>
    </div>
  )
}

// Full page loading state
export function FullPageLoading({ 
  message = "Loading your adventure...",
  showSpinner = true 
}: { 
  message?: string
  showSpinner?: boolean
}) {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        {showSpinner && <LoadingSpinner size="lg" />}
        <p className="text-amber-500 text-lg font-medieval">{message}</p>
      </div>
    </div>
  )
}

// Inline loading state
export function InlineLoading({ 
  message = "Loading...",
  size = "sm"
}: { 
  message?: string
  size?: "sm" | "md" | "lg"
}) {
  return (
    <div className="flex items-center justify-center space-x-2 py-4">
      <LoadingSpinner size={size} />
      <span className="text-gray-400 text-sm">{message}</span>
    </div>
  )
}

// Button loading state
export function ButtonLoading({ 
  children,
  loading = false,
  className = ""
}: { 
  children: React.ReactNode
  loading?: boolean
  className?: string
}) {
  return (
    <div className={cn("flex items-center justify-center space-x-2", className)}>
      {loading && <LoadingSpinner size="sm" />}
      {children}
    </div>
  )
}

// Skeleton components for different content types
export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={cn("bg-gray-800/50 border border-gray-700 rounded-lg p-4", className)}>
      <div className="space-y-3">
        <div className="h-4 bg-gray-700 rounded w-3/4"></div>
        <div className="h-3 bg-gray-700 rounded w-1/2"></div>
        <div className="h-3 bg-gray-700 rounded w-2/3"></div>
      </div>
    </div>
  )
}

export function SkeletonGrid({ 
  rows = 3, 
  cols = 3, 
  className = "" 
}: { 
  rows?: number
  cols?: number
  className?: string
}) {
  return (
    <div className={cn("grid gap-4", className)} style={{ 
      gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
      gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`
    }}>
      {Array.from({ length: rows * cols }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

export function SkeletonList({ 
  items = 5, 
  className = "" 
}: { 
  items?: number
  className?: string
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3 p-3 bg-gray-800/50 border border-gray-700 rounded-lg">
          <div className="h-10 w-10 bg-gray-700 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-gray-700 rounded w-3/4"></div>
            <div className="h-2 bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Game-specific loading states
export function LoadingRealmMap() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-center space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-gray-400">Loading your realm...</p>
      </div>
    </div>
  )
}

export function LoadingQuestList() {
  return (
    <div className="space-y-4">
      <div className="text-center py-8">
        <LoadingSpinner size="md" />
        <p className="text-gray-400 mt-2">Loading quests...</p>
      </div>
      <SkeletonList items={3} />
    </div>
  )
}

export function LoadingInventory() {
  return (
    <div className="space-y-4">
      <div className="text-center py-8">
        <LoadingSpinner size="md" />
        <p className="text-gray-400 mt-2">Loading inventory...</p>
      </div>
      <SkeletonGrid rows={2} cols={4} />
    </div>
  )
}

export function LoadingAchievements() {
  return (
    <div className="space-y-4">
      <div className="text-center py-8">
        <LoadingSpinner size="md" />
        <p className="text-gray-400 mt-2">Loading achievements...</p>
      </div>
      <SkeletonList items={4} />
    </div>
  )
}

// Accessibility-focused loading states
export function LoadingWithAnnouncement({ 
  message = "Loading content...",
  priority = "polite"
}: { 
  message?: string
  priority?: "polite" | "assertive"
}) {
  return (
    <div 
      className="sr-only" 
      aria-live={priority} 
      aria-atomic="true"
    >
      {message}
    </div>
  )
}

// Progress indicator for long operations
export function ProgressIndicator({ 
  progress = 0,
  message = "Processing...",
  showPercentage = true
}: { 
  progress: number
  message?: string
  showPercentage?: boolean
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-400">{message}</span>
        {showPercentage && (
          <span className="text-sm text-amber-400">{Math.round(progress)}%</span>
        )}
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div 
          className="bg-amber-500 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        ></div>
      </div>
    </div>
  )
}

// Loading overlay for modals and dialogs
export function LoadingOverlay({ 
  message = "Loading...",
  showBackdrop = true
}: { 
  message?: string
  showBackdrop?: boolean
}) {
  return (
    <div className={cn(
      "fixed inset-0 z-50 flex items-center justify-center",
      showBackdrop && "bg-black/50 backdrop-blur-sm"
    )}>
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center">
        <LoadingSpinner size="lg" />
        <p className="text-gray-300 mt-3">{message}</p>
      </div>
    </div>
  )
}

// Loading state for data fetching
export function DataLoadingState({ 
  loading,
  error,
  children,
  loadingComponent,
  errorComponent
}: { 
  loading: boolean
  error: Error | null
  children: React.ReactNode
  loadingComponent?: React.ReactNode
  errorComponent?: React.ReactNode
}) {
  if (loading) {
    return loadingComponent || <InlineLoading />
  }

  if (error) {
    return errorComponent || (
      <div className="text-center py-8">
        <p className="text-red-400">Failed to load data</p>
        <p className="text-gray-400 text-sm mt-1">{error.message}</p>
      </div>
    )
  }

  return <>{children}</>
} 