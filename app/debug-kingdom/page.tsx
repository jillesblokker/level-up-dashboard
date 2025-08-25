'use client';

import { useState } from 'react';

export default function DebugKingdomPage() {
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const testEndpoint = async (endpoint: string, method: 'GET' | 'POST' = 'GET') => {
    setLoading(true);
    try {
      const response = await fetch(`/api/${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: method === 'POST' ? JSON.stringify({ test: true }) : undefined,
      });

      const data = await response.json();
      
      setResults(prev => ({
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
      setResults(prev => ({
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
          <div key={endpoint} className="border rounded-lg p-4 bg-white shadow">
            <h3 className="text-lg font-semibold mb-2">{endpoint}</h3>
            
            {result.error ? (
              <div className="text-red-600">
                <strong>Error:</strong> {result.error}
              </div>
            ) : (
              <div>
                <div className="mb-2">
                  <strong>Status:</strong> {result.status} {result.statusText}
                </div>
                
                {result.data && (
                  <div className="mb-2">
                    <strong>Response:</strong>
                    <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                )}
                
                <div className="text-sm text-gray-600">
                  <strong>Timestamp:</strong> {result.timestamp}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {Object.keys(results).length === 0 && (
        <div className="text-center text-gray-500 mt-8">
          Click "Test All Endpoints" to start debugging
        </div>
      )}
    </div>
  );
}
