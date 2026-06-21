"use client"

interface MobileErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export function MobileErrorFallback({ error, resetErrorBoundary }: MobileErrorFallbackProps) {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col items-center justify-center">
      <div className="text-red-500 text-8xl mb-6">⚠️</div>
      <h1 className="text-3xl font-bold mb-4 text-center">Quest Failed</h1>
      <p className="text-gray-300 mb-8 text-center text-lg max-w-sm">
        A mysterious error has occurred in your adventure. Don&apos;t worry, your progress is safe.
      </p>
      
      {error && (
        <div className="bg-gray-800 rounded-lg p-4 mb-8 max-w-sm w-full">
          <div className="text-yellow-400 text-sm font-semibold mb-2">Error Details</div>
          <div className="text-gray-300 text-xs font-mono break-all">
            {error.message}
          </div>
        </div>
      )}
      
      <div className="w-full max-w-sm space-y-4">
        <button
          onClick={resetErrorBoundary}
          className="w-full bg-orange-600 hover:bg-orange-700 active:bg-orange-800 px-6 py-4 rounded-xl flex items-center justify-center gap-3 text-lg font-semibold transition-all duration-200 min-h-[56px] touch-manipulation"
        >
          🔄 Try Again
        </button>
        
        <button
          onClick={() => window.location.reload()}
          className="w-full bg-gray-700 hover:bg-gray-600 active:bg-gray-500 px-6 py-4 rounded-xl flex items-center justify-center gap-3 text-lg font-semibold transition-all duration-200 min-h-[56px] touch-manipulation"
        >
          🔄 Reload Page
        </button>
        
        <button
          onClick={() => window.location.href = '/'}
          className="w-full bg-gray-700 hover:bg-gray-600 active:bg-gray-500 px-6 py-4 rounded-xl flex items-center justify-center gap-3 text-lg font-semibold transition-all duration-200 min-h-[56px] touch-manipulation"
        >
          🏠 Return Home
        </button>
        
        <button
          onClick={() => {
            localStorage.clear();
            window.location.reload();
          }}
          className="w-full bg-red-700 hover:bg-red-600 active:bg-red-500 px-6 py-4 rounded-xl flex items-center justify-center gap-3 text-lg font-semibold transition-all duration-200 min-h-[56px] touch-manipulation"
        >
          ⚠️ Clear Cache & Reload
        </button>
      </div>
      
      <div className="mt-8 text-center text-gray-400 text-sm">
        <p>If the problem persists, try clearing your cache</p>
        <p className="mt-2">Error ID: {Date.now()}</p>
      </div>
    </div>
  );
}
