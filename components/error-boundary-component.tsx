"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCcw } from "lucide-react";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    componentName?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public override state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error(`[ErrorBoundary] Error in ${this.props.componentName || 'component'}:`, error, errorInfo);
    }

    private handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    public override render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex flex-col items-center justify-center p-6 bg-red-950/20 border border-red-900/50 rounded-lg text-center min-h-[200px]">
                    <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
                    <h3 className="text-xl font-bold text-red-500 mb-2">Something went wrong</h3>
                    <p className="text-gray-400 mb-4 max-w-md text-sm">
                        We encountered an unexpected error in the {this.props.componentName || 'component'}.
                        {this.state.error && (
                            <span className="block mt-2 font-mono text-xs bg-black/20 p-2 rounded text-red-300">
                                {this.state.error.message}
                            </span>
                        )}
                    </p>
                    <Button
                        onClick={this.handleRetry}
                        variant="outline"
                        className="border-red-500/50 text-red-400 hover:bg-red-950/50"
                    >
                        <RefreshCcw className="w-4 h-4 mr-2" />
                        Try Again
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}
