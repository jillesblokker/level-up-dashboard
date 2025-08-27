'use client';

import { useState, useEffect } from 'react';
import { getUserPreference, setUserPreference, getAllUserPreferences } from '@/lib/user-preferences-manager';

export default function TestUserPreferencesPage() {
  const [testKey, setTestKey] = useState('test-preference');
  const [testValue, setTestValue] = useState('test-value');
  const [allPreferences, setAllPreferences] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Load all preferences on mount
  useEffect(() => {
    loadAllPreferences();
  }, []);

  const loadAllPreferences = async () => {
    setLoading(true);
    try {
      const prefs = await getAllUserPreferences();
      setAllPreferences(prefs);
      setMessage('✅ All preferences loaded successfully');
    } catch (error) {
      setMessage(`❌ Error loading preferences: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testSetPreference = async () => {
    setLoading(true);
    try {
      const success = await setUserPreference(testKey, testValue);
      if (success) {
        setMessage(`✅ Preference "${testKey}" set successfully`);
        await loadAllPreferences(); // Refresh the list
      } else {
        setMessage(`❌ Failed to set preference "${testKey}"`);
      }
    } catch (error) {
      setMessage(`❌ Error setting preference: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testGetPreference = async () => {
    setLoading(true);
    try {
      const value = await getUserPreference(testKey);
      if (value !== null) {
        setMessage(`✅ Retrieved "${testKey}": ${JSON.stringify(value)}`);
      } else {
        setMessage(`ℹ️ Preference "${testKey}" not found`);
      }
    } catch (error) {
      setMessage(`❌ Error getting preference: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold text-amber-500 mb-6">User Preferences Test</h1>
      
      <div className="bg-black/60 border border-amber-800/50 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-amber-400 mb-4">Test Individual Operations</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Preference Key:</label>
            <input
              type="text"
              value={testKey}
              onChange={(e) => setTestKey(e.target.value)}
              className="w-full px-3 py-2 bg-black/50 border border-amber-800/50 rounded text-white"
              placeholder="Enter preference key"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Preference Value:</label>
            <input
              type="text"
              value={testValue}
              onChange={(e) => setTestValue(e.target.value)}
              className="w-full px-3 py-2 bg-black/50 border border-amber-800/50 rounded text-white"
              placeholder="Enter preference value"
            />
          </div>
        </div>
        
        <div className="flex gap-4">
          <button
            onClick={testSetPreference}
            disabled={loading}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-600 rounded text-white font-medium"
          >
            {loading ? 'Setting...' : 'Set Preference'}
          </button>
          <button
            onClick={testGetPreference}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded text-white font-medium"
          >
            {loading ? 'Getting...' : 'Get Preference'}
          </button>
        </div>
      </div>

      <div className="bg-black/60 border border-amber-800/50 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-amber-400">All Stored Preferences</h2>
          <button
            onClick={loadAllPreferences}
            disabled={loading}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded text-white font-medium"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
        
        {Object.keys(allPreferences).length === 0 ? (
          <p className="text-gray-400">No preferences found. Try setting one above!</p>
        ) : (
          <div className="space-y-2">
            {Object.entries(allPreferences).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-3 bg-black/30 rounded border border-amber-800/30">
                <span className="font-mono text-amber-400">{key}</span>
                <span className="text-gray-300">{JSON.stringify(value)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {message && (
        <div className={`p-4 rounded-lg border ${
          message.startsWith('✅') ? 'bg-green-900/20 border-green-800/50 text-green-300' :
          message.startsWith('❌') ? 'bg-red-900/20 border-red-800/50 text-red-300' :
          'bg-blue-900/20 border-blue-800/50 text-blue-300'
        }`}>
          {message}
        </div>
      )}

      <div className="mt-8 p-4 bg-amber-900/20 border border-amber-800/50 rounded-lg">
        <h3 className="text-lg font-semibold text-amber-400 mb-2">What This Tests:</h3>
        <ul className="text-gray-300 space-y-1 text-sm">
          <li>• <strong>Database Connection:</strong> Can we connect to Supabase?</li>
          <li>• <strong>Authentication:</strong> Is the JWT token working?</li>
          <li>• <strong>CRUD Operations:</strong> Can we create, read, update preferences?</li>
          <li>• <strong>Data Persistence:</strong> Are preferences saved across page refreshes?</li>
          <li>• <strong>Cross-Device Sync:</strong> Will this data appear on other devices?</li>
        </ul>
      </div>
    </div>
  );
}
