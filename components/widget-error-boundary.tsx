"use client"

import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface WrapperProps {
    children: React.ReactNode
    fallbackTitle?: string
}

interface State {
    hasError: boolean
    error: Error | null
}

export class WidgetErrorBoundary extends React.Component<WrapperProps, State> {
    constructor(props: WrapperProps) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error }
    }

    override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error(`[WidgetErrorBoundary] ${this.props.fallbackTitle || 'Widget'} crashed:`, error, errorInfo)
    }

    override render() {
        if (this.state.hasError) {
            return (
                <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-6 flex flex-col items-center justify-center min-h-[200px] text-center">
                    <div className="p-3 bg-red-900/20 rounded-full mb-3">
                        <AlertTriangle className="h-6 w-6 text-red-400" />
                    </div>
                    <div className="text-red-300 font-bold mb-1">
                        {this.props.fallbackTitle || 'Component Unavailable'}
                    </div>
                    <p className="text-xs text-red-400/60 mb-2 max-w-[200px] break-words">
                        {this.state.error?.message || 'Unknown error occurred'}
                    </p>
                    <p className="text-[10px] text-red-500/40 mb-4 font-mono">
                        {this.props.fallbackTitle}
                    </p>
                    <button
                        onClick={() => this.setState({ hasError: false })}
                        className="flex items-center gap-2 px-4 py-2 bg-red-900/40 hover:bg-red-900/60 text-red-200 text-xs font-semibold rounded-lg transition-colors border border-red-800/50"
                    >
                        <RefreshCw className="h-3 w-3" />
                        Try Again
                    </button>
                </div>
            )
        }

        return this.props.children
    }
}
