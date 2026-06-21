import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function QuestCardSkeleton() {
    return (
        <Card className="relative overflow-hidden bg-black border border-amber-800/20">
            {/* Checkbox placeholder */}
            <div className="absolute top-3 right-3 z-10">
                <Skeleton className="w-6 h-6 rounded" />
            </div>

            {/* Header */}
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Difficulty Tag */}
                <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                </div>

                {/* Progress Section */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-2 w-full rounded-full" />
                </div>

                {/* Rewards */}
                <div className="space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-16" />
                    </div>

                    {/* Enhanced Reward Display Box */}
                    <Skeleton className="h-8 w-full rounded-lg mt-2" />
                </div>

                {/* Action Button */}
                <div className="pt-2">
                    <Skeleton className="h-10 w-full rounded-md" />
                </div>
            </CardContent>
        </Card>
    )
}
