'use client';

import { useState } from 'react';
import { migrateKingdomDataToSupabase } from '@/lib/kingdom-data-manager';
import { migrateRealmDataToSupabase } from '@/lib/realm-data-manager';
import { migrateCharacterDataToSupabase } from '@/lib/character-data-manager';
import { migrateLocalStorageToSupabase } from '@/lib/user-preferences-manager';

export default function MigrationTestPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runMigration = async () => {
    setIsRunning(true);
    setResults([]);
    
    try {
      addResult('🚀 Starting migration test...');
      
      // Test each migration phase
      addResult('Phase 1: User Preferences...');
      await migrateLocalStorageToSupabase();
      addResult('✅ User preferences migrated');
      
      addResult('Phase 2: Realm Data...');
      await migrateRealmDataToSupabase();
      addResult('✅ Realm data migrated');
      
      addResult('Phase 3: Character Data...');
      await migrateCharacterDataToSupabase();
      addResult('✅ Character data migrated');
      
      addResult('Phase 4: Kingdom Data...');
      await migrateKingdomDataToSupabase();
      addResult('✅ Kingdom data migrated');
      
      addResult('🎉 All migrations completed successfully!');
      
    } catch (error) {
      addResult(`❌ Migration failed: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  const checkLocalStorage = () => {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) keys.push(key);
    }
    
    const remainingKeys = keys.filter(key => 
      !key.startsWith('supabase-') && 
      !key.startsWith('clerk-') &&
      key !== 'userId'
    );
    
    addResult(`📋 Remaining localStorage keys: ${remainingKeys.length}`);
    remainingKeys.forEach(key => addResult(`  - ${key}`));
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Migration Test Page</h1>
      
      <div className="space-y-4 mb-6">
        <button
          onClick={runMigration}
          disabled={isRunning}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isRunning ? 'Running Migration...' : 'Run Migration Test'}
        </button>
        
        <button
          onClick={checkLocalStorage}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 ml-4"
        >
          Check localStorage
        </button>
      </div>

      <div className="bg-gray-100 rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-2">Migration Results:</h2>
        <div className="space-y-1 max-h-96 overflow-y-auto">
          {results.length === 0 ? (
            <p className="text-gray-500">No results yet. Click &quot;Run Migration Test&quot; to start.</p>
          ) : (
            results.map((result, index) => (
              <div key={index} className="text-sm font-mono">
                {result}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">What This Tests:</h2>
        <ul className="text-blue-700 space-y-1">
          <li>• User preferences migration (game settings, UI state)</li>
          <li>• Realm data migration (animal positions, mystery tiles)</li>
          <li>• Character data migration (perks, potion effects)</li>
          <li>• Kingdom data migration (timers, grid state, challenges)</li>
        </ul>
        <p className="text-sm text-blue-600 mt-2">
          This test will migrate all localStorage data to Supabase without affecting any existing game functionality.
        </p>
      </div>
    </div>
  );
} 