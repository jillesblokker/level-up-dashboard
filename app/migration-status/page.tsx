'use client';

import { useState, useEffect } from 'react';
import { getAllUserPreferences } from '@/lib/user-preferences-manager';
import { getAllRealmData } from '@/lib/realm-data-manager';

interface MigrationStatus {
  userPreferences: Record<string, any>;
  realmData: Record<string, any>;
  kingdomData: Record<string, any>;
  localStorageKeys: string[];
  migrationComplete: boolean;
}

export default function MigrationStatusPage() {
  const [status, setStatus] = useState<MigrationStatus>({
    userPreferences: {},
    realmData: {},
    kingdomData: {},
    localStorageKeys: [],
    migrationComplete: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMigrationStatus = async () => {
      try {
        // Check localStorage for migration completion
        const migrationComplete = localStorage.getItem('supabase-migration-complete') === 'true';
        
        // Get all localStorage keys
        const localStorageKeys: string[] = [];
        if (typeof window !== 'undefined') {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) localStorageKeys.push(key);
          }
        }

        // Get user preferences from Supabase
        const userPreferences = await getAllUserPreferences();
        
        // Get realm data from Supabase
        const realmData = await getAllRealmData();

        // Filter kingdom data from user preferences
        const kingdomData: Record<string, any> = {};
        Object.entries(userPreferences).forEach(([key, value]) => {
          if (key.startsWith('kingdom-') || key === 'challenges' || key === 'character-stats') {
            kingdomData[key] = value;
          }
        });

        setStatus({
          userPreferences,
          realmData,
          kingdomData,
          localStorageKeys,
          migrationComplete
        });
      } catch (error) {
        console.error('Error loading migration status:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMigrationStatus();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Migration Status</h1>
        <div className="animate-pulse">Loading migration status...</div>
      </div>
    );
  }

  const remainingLocalStorageKeys = status.localStorageKeys.filter(key => 
    !key.startsWith('supabase-') && 
    !key.startsWith('clerk-') &&
    key !== 'userId'
  );

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Migration Status</h1>
      
      {/* Overall Status */}
      <div className={`p-4 rounded-lg mb-6 ${
        status.migrationComplete 
          ? 'bg-green-100 border border-green-300 text-green-800' 
          : 'bg-yellow-100 border border-yellow-300 text-yellow-800'
      }`}>
        <h2 className="text-xl font-semibold mb-2">
          {status.migrationComplete ? '✅ Migration Complete' : '🔄 Migration In Progress'}
        </h2>
        <p>
          {status.migrationComplete 
            ? 'All localStorage data has been successfully migrated to Supabase.'
            : 'localStorage data is still being migrated to Supabase.'
          }
        </p>
      </div>

      {/* User Preferences */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">User Preferences in Supabase</h2>
        {Object.keys(status.userPreferences).length > 0 ? (
          <div className="space-y-2">
            {Object.entries(status.userPreferences).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="font-mono text-sm">{key}</span>
                <span className="text-sm text-gray-600">
                  {typeof value === 'object' ? JSON.stringify(value).substring(0, 50) + '...' : String(value)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No user preferences found in Supabase</p>
        )}
      </div>

      {/* Realm Data */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Realm Data in Supabase</h2>
        {Object.keys(status.realmData).length > 0 ? (
          <div className="space-y-2">
            {Object.entries(status.realmData).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="font-mono text-sm">{key}</span>
                <span className="text-sm text-gray-600">
                  {typeof value === 'object' ? JSON.stringify(value).substring(0, 50) + '...' : String(value)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No realm data found in Supabase</p>
        )}
      </div>

      {/* Kingdom Data */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Kingdom Data in Supabase</h2>
        {Object.keys(status.kingdomData).length > 0 ? (
          <div className="space-y-2">
            {Object.entries(status.kingdomData).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="font-mono text-sm">{key}</span>
                <span className="text-sm text-gray-600">
                  {typeof value === 'object' ? JSON.stringify(value).substring(0, 50) + '...' : String(value)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No kingdom data found in Supabase</p>
        )}
      </div>

      {/* Remaining localStorage Keys */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Remaining localStorage Keys</h2>
        {remainingLocalStorageKeys.length > 0 ? (
          <div className="space-y-2">
            {remainingLocalStorageKeys.map(key => (
              <div key={key} className="flex justify-between items-center p-2 bg-yellow-50 rounded">
                <span className="font-mono text-sm">{key}</span>
                <span className="text-sm text-yellow-600">Not migrated</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-green-600">✅ All localStorage keys have been migrated!</p>
        )}
      </div>

      {/* Migration Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-blue-800">Migration Process</h2>
        <div className="space-y-2 text-blue-700">
          <p>• <strong>Phase 1:</strong> User preferences (game settings, UI state)</p>
          <p>• <strong>Phase 2:</strong> Realm data (animal positions, mystery tiles, expansions)</p>
          <p>• <strong>Phase 3:</strong> Character data (perks, potion effects)</p>
          <p>• <strong>Phase 4:</strong> Kingdom data (timers, grid state, challenges)</p>
        </div>
        <p className="mt-4 text-sm text-blue-600">
          The migration runs automatically when you visit the app. If you see remaining localStorage keys, 
          the migration may still be in progress or some data may not have been migrated yet.
        </p>
      </div>
    </div>
  );
}
