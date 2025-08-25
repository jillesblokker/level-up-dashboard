'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, Loader2, Info, Database, HardDrive } from 'lucide-react';

interface CharacterStats {
  gold: number;
  experience: number;
  level: number;
  health: number;
  max_health: number;
  build_tokens?: number;
  kingdom_expansions?: number;
}

interface DebugInfo {
  localStorageAvailable: boolean;
  characterStatsExists: boolean;
  kingdomExpansionsExists: boolean;
  userAuthenticated: boolean;
  apiEndpoint: string;
}

export default function RestoreStatsPage() {
  const { user, isLoaded } = useUser();
  const [localStats, setLocalStats] = useState<CharacterStats | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [restoreResult, setRestoreResult] = useState<{
    success: boolean;
    message: string;
    data?: any;
    error?: any;
  } | null>(null);

  useEffect(() => {
    // Check localStorage availability and data
    const checkLocalStorage = () => {
      const debug: DebugInfo = {
        localStorageAvailable: typeof window !== 'undefined' && typeof localStorage !== 'undefined',
        characterStatsExists: false,
        kingdomExpansionsExists: false,
        userAuthenticated: !!user,
        apiEndpoint: '/api/restore-stats'
      };

      if (debug.localStorageAvailable) {
        try {
          const stored = localStorage.getItem('character-stats');
          debug.characterStatsExists = !!stored;
          
          const kingdomExpansions = localStorage.getItem('kingdom-grid-expansions');
          debug.kingdomExpansionsExists = !!kingdomExpansions;

          if (stored) {
            const stats = JSON.parse(stored);
            setLocalStats({
              gold: stats.gold || 0,
              experience: stats.experience || 0,
              level: stats.level || 1,
              health: stats.health || 100,
              max_health: stats.max_health || 100,
              build_tokens: stats.build_tokens || 0,
              kingdom_expansions: parseInt(localStorage.getItem('kingdom-grid-expansions') || '0', 10)
            });
          }
        } catch (error) {
          console.error('Error reading localStorage:', error);
        }
      }

      setDebugInfo(debug);
    };

    checkLocalStorage();
  }, [user]);

  const handleRestore = async () => {
    if (!localStats || !user) return;

    setIsRestoring(true);
    setRestoreResult(null);

    try {
      // Removed debugging log
      
      const response = await fetch('/api/restore-stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(localStats),
      });

      // Removed debugging logs
      
      const result = await response.json();
      // Removed debugging log

      if (response.ok) {
        setRestoreResult({
          success: true,
          message: 'Stats restored successfully!',
          data: result.data
        });
        
        // Dispatch event to refresh other components
        window.dispatchEvent(new Event('character-stats-update'));
      } else {
        setRestoreResult({
          success: false,
          message: result.error || 'Failed to restore stats',
          error: result.details || result
        });
      }
    } catch (error) {
      console.error('Error restoring stats:', error);
      setRestoreResult({
        success: false,
        message: 'Network error while restoring stats',
        error: error
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      const response = await fetch('/api/debug-stats');
      const result = await response.json();
      // Removed debugging log
      
      setRestoreResult({
        success: true,
        message: 'Database connection test completed',
        data: result
      });
    } catch (error) {
      console.error('Error testing connection:', error);
      setRestoreResult({
        success: false,
        message: 'Failed to test database connection',
        error: error
      });
    }
  };

  if (!isLoaded) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Restore Character Stats</CardTitle>
            <CardDescription>Please sign in to restore your character stats</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Restore Character Stats
          </CardTitle>
          <CardDescription>
            Restore your character stats from localStorage to the database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Debug Information */}
          {debugInfo && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Info className="h-5 w-5" />
                Debug Information
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span>localStorage Available:</span>
                  <span className={debugInfo.localStorageAvailable ? 'text-green-600' : 'text-red-600'}>
                    {debugInfo.localStorageAvailable ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Character Stats Found:</span>
                  <span className={debugInfo.characterStatsExists ? 'text-green-600' : 'text-red-600'}>
                    {debugInfo.characterStatsExists ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Kingdom Expansions Found:</span>
                  <span className={debugInfo.kingdomExpansionsExists ? 'text-green-600' : 'text-red-600'}>
                    {debugInfo.kingdomExpansionsExists ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>User Authenticated:</span>
                  <span className={debugInfo.userAuthenticated ? 'text-green-600' : 'text-red-600'}>
                    {debugInfo.userAuthenticated ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>API Endpoint:</span>
                  <span className="font-mono text-xs">{debugInfo.apiEndpoint}</span>
                </div>
              </div>
            </div>
          )}

          {/* Test Connection Button */}
          <div className="flex gap-2">
            <Button 
              onClick={handleTestConnection}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Database className="h-4 w-4" />
              Test Database Connection
            </Button>
          </div>

          {localStats ? (
            <>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <HardDrive className="h-5 w-5" />
                  Local Storage Data Found:
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span>Gold:</span>
                    <span className="font-mono">{localStats.gold}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Experience:</span>
                    <span className="font-mono">{localStats.experience}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Level:</span>
                    <span className="font-mono">{localStats.level}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Health:</span>
                    <span className="font-mono">{localStats.health}/{localStats.max_health}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Build Tokens:</span>
                    <span className="font-mono">{localStats.build_tokens || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kingdom Expansions:</span>
                    <span className="font-mono">{localStats.kingdom_expansions || 0}</span>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleRestore} 
                disabled={isRestoring}
                className="w-full"
              >
                {isRestoring ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Restoring...
                  </>
                ) : (
                  "Restore to Database"
                )}
              </Button>

              {restoreResult && (
                <Alert className={restoreResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                  {restoreResult.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  )}
                  <AlertDescription className={restoreResult.success ? 'text-green-800' : 'text-red-800'}>
                    <div className="font-semibold">{restoreResult.message}</div>
                    {restoreResult.error && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm">Error Details</summary>
                        <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-auto">
                          {JSON.stringify(restoreResult.error, null, 2)}
                        </pre>
                      </details>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Local Storage Data Found</h3>
              <p className="text-gray-600">
                No character stats found in localStorage. This means either:
              </p>
              <ul className="text-gray-600 mt-2 text-left max-w-md mx-auto">
                <li>• Your stats were already cleared</li>
                <li>• You haven&apos;t played the game yet</li>
                <li>• The data is stored differently</li>
              </ul>
            </div>
          )}

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2">What this does:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Reads your character stats from localStorage</li>
              <li>• Saves them to the database permanently</li>
              <li>• Creates transaction records for audit trail</li>
              <li>• Updates all game components automatically</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 