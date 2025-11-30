"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ResponsiveModalProps {
    isOpen: boolean
    onClose: () => void
    title: string
    children: React.ReactNode
    footer?: React.ReactNode
    maxWidth?: "sm" | "md" | "lg" | "xl"
    className?: string
}

export function ResponsiveModal({
    isOpen,
    onClose,
    title,
    children,
    footer,
    maxWidth = "md",
    className,
}: ResponsiveModalProps) {
    if (!isOpen) return null

    const maxWidthClasses = {
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-lg",
        xl: "max-w-xl",
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal Container */}
            <div
                className={cn(
                    "relative z-10 bg-white dark:bg-gray-900 rounded-lg w-full shadow-lg max-h-[90vh] flex flex-col",
                    maxWidthClasses[maxWidth],
                    className
                )}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                    <h2 id="modal-title" className="text-lg font-semibold">
                        {title}
                    </h2>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-amber-900/50 scrollbar-track-transparent">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-2">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    )
}
