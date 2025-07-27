'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Database } from 'lucide-react';
import { collectLocalStorageData, migrateLocalStorageToSupabase } from '@/lib/migration-utils';

export function MigrationTest() {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTestMigration = async () => {
    if (!user?.id) {
      setError('No user ID available');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // Collect localStorage data
      const localStorageData = collectLocalStorageData();
      console.log('LocalStorage data collected:', localStorageData);

      // Test migration
      const migrationResult = await migrateLocalStorageToSupabase(user.id);
      console.log('Migration result:', migrationResult);

      setResult(migrationResult);
    } catch (err) {
      console.error('Migration test error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestDataLoaders = async () => {
    if (!user?.id) {
      setError('No user ID available');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // Test data loaders
      const { loadGridData, loadCharacterPosition, loadTileInventory } = await import('@/lib/data-loaders');
      
      const gridData = await loadGridData(user.id);
      const position = await loadCharacterPosition(user.id);
      const inventory = await loadTileInventory(user.id);

      setResult({
        gridData: gridData ? 'Loaded' : 'Not found',
        position: position ? 'Loaded' : 'Not found',
        inventory: inventory ? 'Loaded' : 'Not found'
      });
    } catch (err) {
      console.error('Data loader test error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Migration Test
        </CardTitle>
        <CardDescription>
          Test the localStorage to Supabase migration system
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={handleTestMigration}
            disabled={isLoading || !user?.id}
            className="flex-1"
          >
            {isLoading ? 'Testing...' : 'Test Migration'}
          </Button>
          <Button 
            onClick={handleTestDataLoaders}
            disabled={isLoading || !user?.id}
            variant="outline"
            className="flex-1"
          >
            {isLoading ? 'Testing...' : 'Test Loaders'}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </AlertDescription>
          </Alert>
        )}

        {!user?.id && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Please sign in to test the migration</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
} 