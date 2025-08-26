'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';

export default function TestNuclearDebug() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { getToken } = useAuth();

  const testNuclearDebug = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const timestamp = Date.now();
      
      console.log('🧪 Testing Nuclear Debug API...');
      console.log('🧪 Timestamp:', timestamp);
      
      const response = await fetch(`/api/kingdom-stats-debug?tab=quests&period=week&_t=${timestamp}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      console.log('🧪 Nuclear Debug Response:', data);
      console.log('🧪 Response Headers:', Object.fromEntries(response.headers.entries()));
      
      setResult({
        success: response.ok,
        status: response.status,
        data,
        headers: Object.fromEntries(response.headers.entries()),
        timestamp
      });
      
    } catch (error) {
      console.error('🧪 Nuclear Debug Test Failed:', error);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">🧪 Nuclear Debug Test Page</h1>
      
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
        <strong>🚨 NUCLEAR DEBUGGING TEST:</strong> This page tests a completely new API route to bypass any Vercel caching issues.
      </div>
      
      <button
        onClick={testNuclearDebug}
        disabled={loading}
        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mb-6 disabled:opacity-50"
      >
        {loading ? '🧪 Testing...' : '🧪 Test Nuclear Debug API'}
      </button>
      
      {result && (
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-xl font-semibold mb-4">Test Results:</h2>
          <pre className="bg-white p-4 rounded overflow-auto text-sm">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
      
      <div className="mt-6 bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
        <strong>📋 Instructions:</strong>
        <ol className="list-decimal list-inside mt-2 space-y-1">
          <li>Click the &quot;Test Nuclear Debug API&quot; button above</li>
          <li>Check your browser console for detailed logs</li>
          <li>Check Vercel logs for backend nuclear debugging output</li>
          <li>If you see nuclear debugging logs, the new route is working!</li>
        </ol>
      </div>
      
      <div className="mt-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
        <strong>✅ Expected Result:</strong> You should see nuclear debugging logs in Vercel with the message &quot;NUCLEAR-NEW-ROUTE-2025-08-26-20-00&quot;
      </div>
    </div>
  );
}
