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
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 pb-24 md:pb-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-zinc-950 "
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal Container */}
            <div
                className={cn(
                    "relative z-10 bg-white dark:bg-zinc-900 rounded-lg w-full shadow-lg max-h-[85vh] md:max-h-[90vh] flex flex-col",
                    maxWidthClasses[maxWidth],
                    className
                )}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
            >
                {/* Header */}
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                    <h2 id="modal-title" className="text-lg font-semibold">
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        aria-label="Close modal"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-amber-900/50 scrollbar-track-transparent">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    )
}
