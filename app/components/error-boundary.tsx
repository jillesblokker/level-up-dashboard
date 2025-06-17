import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  override render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div 
          className="p-4 border border-red-500 rounded-md bg-red-50"
          role="alert"
          aria-label="tile-placement-error"
        >
          <h3 className="text-red-800 font-semibold mb-2">Something went wrong</h3>
          <p className="text-red-600">{this.state.error?.message}</p>
        </div>
      );
    }

    return this.props.children;
  }
} 