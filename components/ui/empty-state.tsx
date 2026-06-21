import { Card, CardContent } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"
import React from "react"

interface EmptyStateProps {
    icon: LucideIcon
    title: string
    description: string
    action?: React.ReactNode
    className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
    return (
        <Card className={`bg-black/50 border-amber-800/30 border-dashed ${className || ''}`} aria-label="empty-state">
            <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <div className="w-16 h-16 mb-4 rounded-full bg-amber-900/30 flex items-center justify-center border border-amber-500/20">
                    <Icon className="w-8 h-8 text-amber-500" />
                </div>
                <h3 className="text-amber-500 font-semibold text-lg mb-2 text-balance">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed max-w-sm mb-6 text-balance">
                    {description}
                </p>
                {action}
            </CardContent>
        </Card>
    )
}
