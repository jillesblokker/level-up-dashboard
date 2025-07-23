import { Skeleton, SkeletonCard, SkeletonGrid, SkeletonText } from './skeleton'

// Loading states for different components
export function LoadingCard() {
  return (
    <div className="p-4 rounded-lg bg-gray-900/50 border border-gray-800">
      <SkeletonCard />
    </div>
  )
}

export function LoadingGrid({ rows = 3, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-4">
      <SkeletonGrid rows={rows} cols={cols} />
    </div>
  )
}

export function LoadingText() {
  return (
    <div className="space-y-2">
      <SkeletonText />
    </div>
  )
}

// Specific loading states for game components
export function LoadingRealmMap() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
        <p className="text-gray-400">Loading your realm...</p>
      </div>
    </div>
  )
}

export function LoadingCharacter() {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <SkeletonText />
    </div>
  )
}

export function LoadingQuestList() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="p-4 rounded-lg bg-gray-900/50 border border-gray-800">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-8 w-8 rounded" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Accessibility-focused loading states
export function LoadingWithAnnouncement({ message = "Loading content..." }: { message?: string }) {
  return (
    <div 
      className="sr-only" 
      aria-live="polite" 
      aria-atomic="true"
    >
      {message}
    </div>
  )
}

export function LoadingSpinner({ size = "md", label = "Loading" }: { size?: "sm" | "md" | "lg"; label?: string }) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8", 
    lg: "h-12 w-12"
  }
  
  return (
    <div className="flex items-center justify-center space-x-2" role="status" aria-label={label}>
      <div className={`animate-spin rounded-full border-b-2 border-amber-500 ${sizeClasses[size]}`}></div>
      <span className="sr-only">{label}</span>
    </div>
  )
} 