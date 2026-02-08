"use client"

import React from 'react'
import { AlertTriangle, RefreshCw, Loader2 } from 'lucide-react'

interface WrapperProps {
    children: React.ReactNode
    fallbackTitle?: string
}

interface State {
    hasError: boolean
    error: Error | null
    isRetrying: boolean
}

export class WidgetErrorBoundary extends React.Component<WrapperProps, State> {
    constructor(props: WrapperProps) {
        super(props)
        this.state = { hasError: false, error: null, isRetrying: false }
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error, isRetrying: false }
    }

    override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error(`[WidgetErrorBoundary] ${this.props.fallbackTitle || 'Widget'} crashed:`, error, errorInfo)
    }

    handleRetry = () => {
        // Set retrying state to show loading indicator
        this.setState({ isRetrying: true });

        // Add a small delay before retrying to allow any async operations to settle
        // This helps with iOS Safari localStorage timing issues
        setTimeout(() => {
            this.setState({ hasError: false, error: null, isRetrying: false });
        }, 500);
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
                        onClick={this.handleRetry}
                        disabled={this.state.isRetrying}
                        className="flex items-center gap-2 px-4 py-2 bg-red-900/40 hover:bg-red-900/60 text-red-200 text-xs font-semibold rounded-lg transition-colors border border-red-800/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {this.state.isRetrying ? (
                            <>
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Retrying...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="h-3 w-3" />
                                Try Again
                            </>
                        )}
                    </button>
                </div>
            )
        }

        return this.props.children
    }
}
