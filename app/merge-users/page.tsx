'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';

export default function MergeUsersPage() {
  const { getToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleMerge = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const token = await getToken();
      
      const response = await fetch('/api/merge-user-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to merge user data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Merge User Data
          </h1>
          
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              This will merge all challenge and milestone completion data from different user IDs 
              to your current user account. This is useful when you have data scattered across 
              multiple user IDs but you&apos;re the only user in the system.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2">What this does:</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Finds all challenge completion records from different user IDs</li>
                <li>• Finds all milestone completion records from different user IDs</li>
                <li>• Updates them all to use your current user ID</li>
                <li>• Shows you exactly what was merged</li>
              </ul>
            </div>
          </div>

          <button
            onClick={handleMerge}
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-md font-medium text-white transition-colors ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            }`}
          >
            {isLoading ? 'Merging...' : 'Merge All User Data'}
          </button>

          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-md p-4">
              <h3 className="text-sm font-medium text-red-800 mb-2">Error:</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {result && (
            <div className="mt-6 bg-green-50 border border-green-200 rounded-md p-4">
              <h3 className="text-sm font-medium text-green-800 mb-2">Merge Successful!</h3>
              <div className="text-sm text-green-700 space-y-2">
                <p><strong>Message:</strong> {result.message}</p>
                <p><strong>Challenges Updated:</strong> {result.updates.challenges}</p>
                <p><strong>Milestones Updated:</strong> {result.updates.milestones}</p>
                
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Final State:</h4>
                  <div className="bg-white rounded border p-3 space-y-2">
                    <div>
                      <strong>Challenges:</strong> {result.finalState.challenges.totalRecords} records, 
                      {result.finalState.challenges.uniqueUsers} unique user(s)
                    </div>
                    <div>
                      <strong>Milestones:</strong> {result.finalState.milestones.totalRecords} records, 
                      {result.finalState.milestones.uniqueUsers} unique user(s)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 text-sm text-gray-500">
            <p>
              <strong>Note:</strong> After merging, refresh your kingdom stats page to see the 
              combined data in the challenges and milestones tabs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
