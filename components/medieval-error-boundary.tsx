import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Shield, Sword } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  medieval?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

export class MedievalErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Medieval Error Boundary caught an error:', error, errorInfo);
    }

    // Call custom error handler
    this.props.onError?.(error, errorInfo);

    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo);
    }
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // In a real app, you'd send this to your error tracking service
    console.error('Production error:', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });
  };

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
      }));
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isMedieval = this.props.medieval !== false;

      if (isMedieval) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-900 via-gray-900 to-amber-800 p-4">
            <Card className="w-full max-w-md border-amber-800/30 bg-amber-900/10 backdrop-blur-sm">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 border-2 border-red-500/30">
                  <Shield className="h-8 w-8 text-red-400" />
                </div>
                <CardTitle className="text-2xl text-amber-100 font-serif">
                  ⚔️ Kingdom Under Siege! ⚔️
                </CardTitle>
                <CardDescription className="text-amber-200 font-medium">
                  A dark force has disrupted our realm. Fear not, brave adventurer - your progress remains safe in our vaults.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="bg-amber-800/20 border border-amber-700/30 rounded-lg p-3">
                  <p className="text-amber-100 text-sm text-center">
                    "Even the mightiest castles face storms. What matters is how we rebuild."
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    onClick={this.handleRetry}
                    disabled={this.state.retryCount >= this.maxRetries}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-amber-50 border border-amber-500/30"
                  >
                    <Sword className="h-4 w-4 mr-2" />
                    {this.state.retryCount >= this.maxRetries 
                      ? '⚔️ All attempts exhausted' 
                      : `⚔️ Rally the troops (${this.maxRetries - this.state.retryCount} left)`
                    }
                  </Button>
                  
                  <Button
                    onClick={this.handleReload}
                    variant="outline"
                    className="w-full border-amber-600/50 text-amber-200 hover:bg-amber-800/30"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    🔄 Summon reinforcements
                  </Button>
                  
                  <Button
                    onClick={this.handleGoHome}
                    variant="outline"
                    className="w-full border-amber-600/50 text-amber-200 hover:bg-amber-800/30"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    🏰 Return to castle
                  </Button>
                </div>

                {this.props.showDetails && this.state.error && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm text-amber-300 hover:text-amber-200 font-medium">
                      📜 Scroll of Technical Details
                    </summary>
                    <div className="mt-2 p-3 bg-gray-800/50 border border-gray-700/50 rounded text-xs text-gray-300 font-mono overflow-auto max-h-32">
                      <div className="mb-2">
                        <strong className="text-red-400">Error:</strong> {this.state.error.message}
                      </div>
                      {this.state.error.stack && (
                        <div>
                          <strong className="text-red-400">Stack:</strong>
                          <pre className="whitespace-pre-wrap mt-1">
                            {this.state.error.stack}
                          </pre>
                        </div>
                      )}
                      {this.state.errorInfo?.componentStack && (
                        <div className="mt-2">
                          <strong className="text-red-400">Component Stack:</strong>
                          <pre className="whitespace-pre-wrap mt-1">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                )}

                <div className="text-xs text-amber-400 text-center font-medium">
                  🏰 Scroll ID: {Date.now().toString(36).toUpperCase()}
                </div>
              </CardContent>
            </Card>
          </div>
        );
      }

      // Fallback to standard error boundary
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
          <Card className="w-full max-w-md border-red-800/30 bg-red-900/10">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
              <CardTitle className="text-xl text-white">
                Something went wrong
              </CardTitle>
              <CardDescription className="text-gray-400">
                We encountered an unexpected error. Don't worry, your progress is safe.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2">
                <Button
                  onClick={this.handleRetry}
                  disabled={this.state.retryCount >= this.maxRetries}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-black"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {this.state.retryCount >= this.maxRetries 
                    ? 'Max retries reached' 
                    : `Try Again (${this.maxRetries - this.state.retryCount} left)`
                  }
                </Button>
                
                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reload Page
                </Button>
                
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>
              </div>

              {this.props.showDetails && this.state.error && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300">
                    Technical Details
                  </summary>
                  <div className="mt-2 p-3 bg-gray-800 rounded text-xs text-gray-300 font-mono overflow-auto max-h-32">
                    <div className="mb-2">
                      <strong>Error:</strong> {this.state.error.message}
                    </div>
                    {this.state.error.stack && (
                      <div>
                        <strong>Stack:</strong>
                        <pre className="whitespace-pre-wrap mt-1">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                    {this.state.errorInfo?.componentStack && (
                      <div className="mt-2">
                        <strong>Component Stack:</strong>
                        <pre className="whitespace-pre-wrap mt-1">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              <div className="text-xs text-gray-500 text-center">
                Error ID: {Date.now().toString(36)}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
