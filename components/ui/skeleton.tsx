import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-800/50", className)}
      {...props}
    />
  )
}

// Specific skeleton components for common use cases
export function SkeletonCard() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  )
}

export function SkeletonAvatar() {
  return <Skeleton className="h-12 w-12 rounded-full" />
}

export function SkeletonButton() {
  return <Skeleton className="h-10 w-24" />
}

export function SkeletonInput() {
  return <Skeleton className="h-10 w-full" />
}

export function SkeletonText() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  )
}

export function SkeletonTile() {
  return <Skeleton className="h-16 w-16 rounded-lg" />
}

export function SkeletonGrid({ rows = 3, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {Array.from({ length: rows * cols }).map((_, i) => (
        <SkeletonTile key={i} />
      ))}
    </div>
  )
}

export { Skeleton }
