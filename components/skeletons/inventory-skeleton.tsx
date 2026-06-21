import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function InventorySkeleton() {
    return (
        <div className="container mx-auto p-6">
            <div className="mb-6 space-y-2">
                <Skeleton className="h-10 w-48 bg-gray-800" />
                <Skeleton className="h-4 w-96 bg-gray-800" />
            </div>

            <Card className="bg-black border-amber-800">
                <div className="p-6 border-b border-amber-800/30 flex justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-32 bg-gray-800" />
                        <Skeleton className="h-4 w-24 bg-gray-800" />
                    </div>
                    <Skeleton className="h-10 w-24 bg-gray-800" />
                </div>
                <div className="p-6">
                    {/* Tabs Placeholder */}
                    <div className="grid w-full grid-cols-6 mb-6 gap-2">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Skeleton key={i} className="h-10 bg-gray-800/50" />
                        ))}
                    </div>

                    {/* Items Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.from({ length: 9 }).map((_, i) => (
                            <div key={i} className="border border-gray-800/50 rounded-lg bg-gray-900/40 p-4 flex gap-4 animate-pulse">
                                <Skeleton className="w-16 h-16 rounded-lg shrink-0 bg-gray-800" />
                                <div className="flex-1 space-y-2 min-w-0">
                                    <div className="flex justify-between">
                                        <Skeleton className="h-5 w-2/3 bg-gray-800" />
                                        <Skeleton className="h-5 w-16 rounded-full bg-gray-800" />
                                    </div>
                                    <Skeleton className="h-4 w-full bg-gray-800/50" />
                                    <div className="flex justify-between pt-2">
                                        <Skeleton className="h-4 w-20 bg-gray-800/50" />
                                        <Skeleton className="h-4 w-12 bg-gray-800/50" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Card>
        </div>
    )
}
