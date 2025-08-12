"use client"

import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetErrorBoundary: () => void }>;
}

export function ErrorBoundary({ children, fallback }: ErrorBoundaryProps) {
  const [hasError, setHasError] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Error caught by boundary:', event.error);
      setError(event.error);
      setHasError(true);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      setError(new Error(event.reason?.message || 'Promise rejected'));
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const resetErrorBoundary = () => {
    setHasError(false);
    setError(null);
  };

  if (hasError && error) {
    if (fallback) {
      const FallbackComponent = fallback;
      return <FallbackComponent error={error} resetErrorBoundary={resetErrorBoundary} />;
    }

    return (
      <div className="min-h-screen bg-gray-900 text-white p-4 flex flex-col items-center justify-center">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold mb-2 text-center">Quest Failed</h1>
        <p className="text-gray-300 mb-6 text-center max-w-md">
          A mysterious error has occurred in your adventure. Don&apos;t worry, your progress is safe.
        </p>
        
        <div className="bg-gray-800 rounded-lg p-4 mb-6 max-w-md w-full">
          <div className="text-yellow-400 text-sm font-semibold mb-2">Error Details</div>
          <div className="text-gray-300 text-xs font-mono break-all">
            {error.message}
          </div>
        </div>
        
        <div className="space-y-3 w-full max-w-sm">
          <button
            onClick={resetErrorBoundary}
            className="w-full bg-orange-600 hover:bg-orange-700 px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            🔄 Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gray-700 hover:bg-gray-600 px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            🔄 Reload Page
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-gray-700 hover:bg-gray-600 px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            🏠 Return Home
          </button>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            className="w-full bg-red-700 hover:bg-red-600 px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            ⚠️ Clear Cache & Reload
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
