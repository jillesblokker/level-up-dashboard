"use client"

import { cn } from "@/lib/utils"

interface SkeletonProps {
    className?: string
    style?: React.CSSProperties
}

function Skeleton({ className, style }: SkeletonProps) {
    return (
        <div
            className={cn(
                "animate-pulse rounded-md bg-amber-900/20",
                className
            )}
            style={style}
        />
    )
}

/**
 * Page skeleton for Kingdom page
 */
export function KingdomPageSkeleton() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-950 to-black p-4 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-8 w-32" />
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-10 w-24" />
                ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-square" />
                ))}
            </div>
        </div>
    )
}

/**
 * Page skeleton for Quests page
 */
export function QuestsPageSkeleton() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-950 to-black p-4 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-8 w-24" />
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 mb-4">
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-8 w-20" />
                ))}
            </div>

            {/* Quest cards */}
            <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-lg border border-amber-800/20 bg-black/40">
                        <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-5 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </div>
                        <Skeleton className="h-8 w-8 rounded" />
                    </div>
                ))}
            </div>
        </div>
    )
}

/**
 * Page skeleton for Profile page
 */
export function ProfilePageSkeleton() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-950 to-black p-4 space-y-6">
            {/* Avatar and name */}
            <div className="flex flex-col items-center gap-4">
                <Skeleton className="h-24 w-24 rounded-full" />
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 rounded-lg border border-amber-800/20 bg-black/40 text-center">
                        <Skeleton className="h-8 w-16 mx-auto mb-2" />
                        <Skeleton className="h-4 w-12 mx-auto" />
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-10 flex-1" />
                ))}
            </div>

            {/* Content */}
            <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                ))}
            </div>
        </div>
    )
}

/**
 * Page skeleton for Social page
 */
export function SocialPageSkeleton() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-950 to-black p-4 space-y-6">
            {/* Header */}
            <Skeleton className="h-8 w-40" />

            {/* Tabs */}
            <div className="flex gap-2">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-10 w-24" />
                ))}
            </div>

            {/* Friends list */}
            <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-lg border border-amber-800/20 bg-black/40">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-5 w-1/3" />
                            <Skeleton className="h-4 w-1/4" />
                        </div>
                        <Skeleton className="h-8 w-20 rounded" />
                    </div>
                ))}
            </div>
        </div>
    )
}

/**
 * Generic card skeleton
 */
export function CardSkeleton({ count = 1 }: { count?: number }) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="p-4 rounded-lg border border-amber-800/20 bg-black/40 space-y-3"
                >
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <Skeleton className="h-5 w-1/2" />
                    </div>
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
            ))}
        </>
    )
}

/**
 * Stats card skeleton
 */
export function StatsCardSkeleton() {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-4 rounded-lg border border-amber-800/20 bg-black/40 text-center">
                    <Skeleton className="h-6 w-12 mx-auto mb-2" />
                    <Skeleton className="h-4 w-16 mx-auto" />
                </div>
            ))}
        </div>
    )
}

/**
 * Chart skeleton
 */
export function ChartSkeleton() {
    return (
        <div className="p-4 rounded-lg border border-amber-800/20 bg-black/40">
            <Skeleton className="h-6 w-40 mb-4" />
            <div className="flex items-end justify-around h-48 gap-2">
                {Array.from({ length: 7 }).map((_, i) => (
                    <Skeleton
                        key={i}
                        className="w-8 rounded-t"
                        style={{ height: `${Math.random() * 60 + 20}%` }}
                    />
                ))}
            </div>
            <div className="flex justify-around mt-2">
                {Array.from({ length: 7 }).map((_, i) => (
                    <Skeleton key={i} className="h-3 w-6" />
                ))}
            </div>
        </div>
    )
}

export { Skeleton }
