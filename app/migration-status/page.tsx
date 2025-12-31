'use client';

import { useState, useEffect } from 'react';
import { getAllUserPreferences } from '@/lib/user-preferences-manager';
import { getAllRealmData } from '@/lib/realm-data-manager';
import { TEXT_CONTENT } from '@/lib/text-content';

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
        <h1 className="text-2xl font-bold mb-4">{TEXT_CONTENT.migration.title}</h1>
        <div className="animate-pulse">{TEXT_CONTENT.migration.loading}</div>
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
      <h1 className="text-3xl font-bold mb-6">{TEXT_CONTENT.migration.title}</h1>

      {/* Overall Status */}
      <div className={`p-4 rounded-lg mb-6 ${status.migrationComplete
        ? 'bg-green-100 border border-green-300 text-green-800'
        : 'bg-yellow-100 border border-yellow-300 text-yellow-800'
        }`}>
        <h2 className="text-xl font-semibold mb-2">
          {status.migrationComplete ? TEXT_CONTENT.migration.complete : TEXT_CONTENT.migration.inProgress}
        </h2>
        <p>
          {status.migrationComplete
            ? TEXT_CONTENT.migration.completeDesc
            : TEXT_CONTENT.migration.inProgressDesc
          }
        </p>
      </div>

      {/* User Preferences */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">{TEXT_CONTENT.migration.userPreferences.title}</h2>
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
          <p className="text-gray-500">{TEXT_CONTENT.migration.userPreferences.empty}</p>
        )}
      </div>

      {/* Realm Data */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">{TEXT_CONTENT.migration.realmData.title}</h2>
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
          <p className="text-gray-500">{TEXT_CONTENT.migration.realmData.empty}</p>
        )}
      </div>

      {/* Kingdom Data */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">{TEXT_CONTENT.migration.kingdomData.title}</h2>
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
          <p className="text-gray-500">{TEXT_CONTENT.migration.kingdomData.empty}</p>
        )}
      </div>

      {/* Remaining localStorage Keys */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">{TEXT_CONTENT.migration.localStorage.title}</h2>
        {remainingLocalStorageKeys.length > 0 ? (
          <div className="space-y-2">
            {remainingLocalStorageKeys.map(key => (
              <div key={key} className="flex justify-between items-center p-2 bg-yellow-50 rounded">
                <span className="font-mono text-sm">{key}</span>
                <span className="text-sm text-yellow-600">{TEXT_CONTENT.migration.localStorage.notMigrated}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-green-600">{TEXT_CONTENT.migration.localStorage.allMigrated}</p>
        )}
      </div>

      {/* Migration Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-blue-800">{TEXT_CONTENT.migration.process.title}</h2>
        <div className="space-y-2 text-blue-700">
          <p dangerouslySetInnerHTML={{ __html: TEXT_CONTENT.migration.process.phase1.replace('• ', '• <strong>').replace(':', ':</strong>') }} />
          <p dangerouslySetInnerHTML={{ __html: TEXT_CONTENT.migration.process.phase2.replace('• ', '• <strong>').replace(':', ':</strong>') }} />
          <p dangerouslySetInnerHTML={{ __html: TEXT_CONTENT.migration.process.phase3.replace('• ', '• <strong>').replace(':', ':</strong>') }} />
          <p dangerouslySetInnerHTML={{ __html: TEXT_CONTENT.migration.process.phase4.replace('• ', '• <strong>').replace(':', ':</strong>') }} />
        </div>
        <p className="mt-4 text-sm text-blue-600">
          {TEXT_CONTENT.migration.process.footer}
        </p>
      </div>
    </div>
  );
}
