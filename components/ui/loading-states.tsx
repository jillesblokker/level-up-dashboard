"use client"

import { Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface LoadingStateProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingState({ message = "Loading...", size = 'md', className = "" }: LoadingStateProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  return (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <div className="flex flex-col items-center gap-3">
        <Loader2 className={`animate-spin text-amber-500 ${sizeClasses[size]}`} />
        <span className="text-amber-500/80 text-sm font-medium tracking-wide">{message}</span>
      </div>
    </div>
  )
}

export function FullPageLoading({ message = "Summoning the Realm..." }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-amber-500/10"></div>
          <Loader2 className="animate-spin text-amber-500 h-12 w-12" />
        </div>
        <span className="text-amber-400 text-xl font-medieval tracking-widest">{message}</span>
      </div>
    </div>
  )
}

interface DataLoadingStateProps {
  isLoading: boolean
  error: string | null
  onRetry?: () => void
  children: React.ReactNode
  loadingMessage?: string
  errorMessage?: string
  skeleton?: React.ReactNode
}

export function DataLoadingState({
  isLoading,
  error,
  onRetry,
  children,
  loadingMessage = "Loading data...",
  errorMessage = "Failed to load data",
  skeleton
}: DataLoadingStateProps) {
  if (isLoading) {
    if (skeleton) return <>{skeleton}</>;
    return <LoadingState message={loadingMessage} />
  }

  if (error) {
    return (
      <Card className="bg-red-900/20 border-red-500/30">
        <CardContent className="p-6 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="text-red-400 text-lg font-semibold">{errorMessage}</div>
            <div className="text-gray-300 text-sm">{error}</div>
            {onRetry && (
              <Button onClick={onRetry} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return <>{children}</>
}

interface SkeletonProps {
  className?: string
  lines?: number
}

export function Skeleton({ className = "", lines = 1 }: SkeletonProps) {
  return (
    <div className={`animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-gray-700 rounded mb-2"
          style={{ width: `${Math.random() * 40 + 60}%` }}
        />
      ))}
    </div>
  )
} 