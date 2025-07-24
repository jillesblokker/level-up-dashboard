'use client'

import React from 'react'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  errorId: string | null
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
}

export class GlobalErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('GlobalErrorBoundary caught an error:', error, errorInfo)
    
    // Log error to monitoring service (if available)
    this.logError(error, errorInfo)
    
    this.setState({ errorInfo })
  }

  private logError = (error: Error, errorInfo: React.ErrorInfo) => {
    // In a real app, you'd send this to your error monitoring service
    const errorData = {
      errorId: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    }

    console.group('Error Details')
    console.error('Error ID:', errorData.errorId)
    console.error('Error:', errorData.message)
    console.error('Stack:', errorData.stack)
    console.error('Component Stack:', errorData.componentStack)
    console.groupEnd()

    // Store error in localStorage for debugging
    try {
      const errorLog = JSON.parse(localStorage.getItem('errorLog') || '[]')
      errorLog.push(errorData)
      // Keep only last 10 errors
      if (errorLog.length > 10) {
        errorLog.splice(0, errorLog.length - 10)
      }
      localStorage.setItem('errorLog', JSON.stringify(errorLog))
    } catch (e) {
      console.error('Failed to log error to localStorage:', e)
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <this.props.fallback error={this.state.error!} resetError={this.resetError} />
      }

      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl bg-black border-amber-800/50">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <AlertTriangle className="h-8 w-8 text-red-500" />
                <CardTitle className="text-2xl font-bold text-red-400">Quest Failed</CardTitle>
              </div>
              <CardDescription className="text-gray-300">
                A mysterious error has occurred in your adventure. Don&apos;t worry, your progress is safe.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Error Details */}
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Bug className="h-4 w-4 text-amber-400" />
                  <span className="text-sm font-medium text-amber-400">Error Details</span>
                  {this.state.errorId && (
                    <Badge variant="outline" className="text-xs">
                      ID: {this.state.errorId}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-300 font-mono">
                  {this.state.error?.message || 'Unknown error occurred'}
                </p>
              </div>

              {/* Recovery Options */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white">Recovery Options</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button
                    onClick={this.resetError}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                    aria-label="Try to recover from error"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                  
                  <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    className="w-full border-amber-800/50 text-amber-400 hover:bg-amber-900/20"
                    aria-label="Reload the page"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reload Page
                  </Button>
                  
                  <Button
                    onClick={() => window.location.href = '/'}
                    variant="outline"
                    className="w-full border-amber-800/50 text-amber-400 hover:bg-amber-900/20"
                    aria-label="Return to home page"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Return Home
                  </Button>
                  
                  <Button
                    onClick={() => {
                      // Clear localStorage and reload
                      localStorage.clear()
                      window.location.reload()
                    }}
                    variant="outline"
                    className="w-full border-red-800/50 text-red-400 hover:bg-red-900/20"
                    aria-label="Clear data and reload"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Clear Data & Reload
                  </Button>
                </div>
              </div>

              {/* Development Details */}
              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300">
                    Technical Details (Development)
                  </summary>
                  <div className="mt-2 p-3 bg-gray-800 rounded text-xs font-mono text-gray-300 overflow-auto max-h-40">
                    <div className="mb-2">
                      <strong>Error Stack:</strong>
                      <pre className="whitespace-pre-wrap">{this.state.error?.stack}</pre>
                    </div>
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                    </div>
                  </div>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook for functional components to catch errors
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  const handleError = React.useCallback((error: Error) => {
    console.error('Error caught by useErrorHandler:', error)
    setError(error)
  }, [])

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  return { error, handleError, resetError }
} 