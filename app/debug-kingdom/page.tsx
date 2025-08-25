'use client';

import { useState } from 'react';

export default function DebugKingdomPage() {
  const [results, setResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  const testEndpoint = async (endpoint: string, method: 'GET' | 'POST' = 'GET') => {
    setLoading(true);
    try {
      const fetchOptions: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };
      
      if (method === 'POST') {
        fetchOptions.body = JSON.stringify({ test: true });
      }

      const response = await fetch(`/api/${endpoint}`, fetchOptions);

      const data = await response.json();
      
      setResults((prev: Record<string, any>) => ({
        ...prev,
        [endpoint]: {
          status: response.status,
          statusText: response.statusText,
          data,
          headers: Object.fromEntries(response.headers.entries()),
          timestamp: new Date().toISOString()
        }
      }));
    } catch (error) {
      setResults((prev: Record<string, any>) => ({
        ...prev,
        [endpoint]: {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      }));
    } finally {
      setLoading(false);
    }
  };

  const testAllEndpoints = async () => {
    setLoading(true);
    await Promise.all([
      testEndpoint('kingdom-timers', 'GET'),
      testEndpoint('kingdom-timers', 'POST'),
      testEndpoint('kingdom-items', 'GET'),
      testEndpoint('kingdom-items', 'POST'),
      testEndpoint('kingdom-tile-states', 'GET'),
      testEndpoint('kingdom-tile-states', 'POST'),
      testEndpoint('kingdom-grid', 'GET'),
      testEndpoint('kingdom-grid', 'POST'),
    ]);
    setLoading(false);
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Kingdom API Debug Page</h1>
      
      <div className="mb-6">
        <button
          onClick={testAllEndpoints}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-4"
        >
          {loading ? 'Testing...' : 'Test All Endpoints'}
        </button>
        
        <button
          onClick={() => setResults({})}
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
        >
          Clear Results
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(results).map(([endpoint, result]: [string, any]) => (
          <div key={endpoint} className="border rounded-lg p-4 bg-gray-800 text-white shadow">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-white">{endpoint}</h3>
              <button
                onClick={() => {
                  const logText = JSON.stringify({
                    endpoint,
                    ...result
                  }, null, 2);
                  navigator.clipboard.writeText(logText);
                  // Show a brief success message
                  const button = event?.target as HTMLButtonElement;
                  if (button) {
                    const originalText = button.textContent;
                    button.textContent = 'Copied!';
                    button.className = 'bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 rounded';
                    setTimeout(() => {
                      button.textContent = originalText;
                      button.className = 'bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded';
                    }, 2000);
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded"
              >
                Copy Log
              </button>
            </div>
            
            {result.error ? (
              <div className="text-red-400">
                <strong>Error:</strong> {result.error}
              </div>
            ) : (
              <div>
                <div className="mb-3 text-green-400">
                  <strong>Status:</strong> {result.status} {result.statusText}
                </div>
                
                {result.data && (
                  <div className="mb-3">
                    <strong className="text-yellow-400">Response:</strong>
                    <pre className="bg-gray-900 p-3 rounded text-sm overflow-auto text-gray-200 border border-gray-600">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                )}
                
                <div className="text-sm text-gray-300">
                  <strong>Timestamp:</strong> {result.timestamp}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {Object.keys(results).length === 0 && (
        <div className="text-center text-gray-500 mt-8">
          Click &quot;Test All Endpoints&quot; to start debugging
        </div>
      )}
    </div>
  );
}
