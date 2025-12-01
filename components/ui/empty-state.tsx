"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"

interface EmptyStateProps {
    title: string
    description: string
    imageSrc: string
    actionLabel?: string
    onAction?: () => void
}

export function EmptyState({
    title,
    description,
    imageSrc,
    actionLabel,
    onAction
}: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="relative w-48 h-48 mb-6 opacity-90 hover:opacity-100 transition-opacity duration-300">
                <Image
                    src={imageSrc}
                    alt={title}
                    fill
                    className="object-contain drop-shadow-2xl"
                />
            </div>

            <h3 className="text-xl font-bold text-amber-500 font-medieval mb-2">
                {title}
            </h3>

            <p className="text-muted-foreground max-w-sm mb-8">
                {description}
            </p>

            {actionLabel && onAction && (
                <Button
                    onClick={onAction}
                    className="bg-amber-600 hover:bg-amber-700 text-white border border-amber-800"
                >
                    <PlusCircle className="w-4 h-4 mr-2" />
                    {actionLabel}
                </Button>
            )}
        </div>
    )
}
