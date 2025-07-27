'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2, Database, HardDrive } from 'lucide-react';
import { collectLocalStorageData, migrateLocalStorageToSupabase, MigrationResult } from '@/lib/migration-utils';

interface MigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export function MigrationModal({ isOpen, onClose, onComplete }: MigrationModalProps) {
  const { user } = useUser();
  const [isMigrating, setIsMigrating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [localData, setLocalData] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      // Collect local data when modal opens
      const data = collectLocalStorageData();
      setLocalData(data);
    }
  }, [isOpen]);

  const handleMigration = async () => {
    if (!user?.id) return;

    setIsMigrating(true);
    setProgress(0);
    setResult(null);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const migrationResult = await migrateLocalStorageToSupabase(user.id);

      clearInterval(progressInterval);
      setProgress(100);
      setResult(migrationResult);

      if (migrationResult.success) {
        // Call onComplete after a short delay
        setTimeout(() => {
          onComplete?.();
          onClose();
        }, 2000);
      }

    } catch (error) {
      console.error('Migration error:', error);
      setResult({
        success: false,
        migrated: [],
        errors: [error instanceof Error ? error.message : 'Unknown error']
      });
    } finally {
      setIsMigrating(false);
    }
  };

  const hasLocalData = localData && Object.values(localData).some(data => data !== undefined);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Migration
          </CardTitle>
          <CardDescription>
            Migrate your local game data to the cloud for better sync and backup
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Data Summary */}
          {localData && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Local Data Found:</h4>
              <div className="text-xs space-y-1">
                {localData.gridData && <div>• Grid/Map Data</div>}
                {localData.characterPosition && <div>• Character Position</div>}
                {localData.tileInventory && <div>• Tile Inventory</div>}
                {localData.userPreferences && <div>• User Preferences</div>}
                {localData.imageDescriptions && <div>• Image Descriptions</div>}
                {localData.gameSettings && <div>• Game Settings</div>}
              </div>
            </div>
          )}

          {/* No Data Message */}
          {!hasLocalData && (
            <Alert>
              <HardDrive className="h-4 w-4" />
              <AlertDescription>
                No local data found to migrate. Your data is already in the cloud.
              </AlertDescription>
            </Alert>
          )}

          {/* Migration Progress */}
          {isMigrating && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Migrating data...
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Migration Result */}
          {result && (
            <div className="space-y-2">
              {result.success ? (
                <Alert>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-600">
                    Migration completed successfully!
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-600">
                    Migration failed. Please try again.
                  </AlertDescription>
                </Alert>
              )}

              {result.migrated.length > 0 && (
                <div className="text-xs">
                  <div className="font-medium">Migrated:</div>
                  <div className="space-y-1">
                    {result.migrated.map(item => (
                      <div key={item}>• {item}</div>
                    ))}
                  </div>
                </div>
              )}

              {result.errors.length > 0 && (
                <div className="text-xs text-red-600">
                  <div className="font-medium">Errors:</div>
                  <div className="space-y-1">
                    {result.errors.map((error, index) => (
                      <div key={index}>• {error}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            {!isMigrating && !result && (
              <>
                <Button 
                  onClick={handleMigration} 
                  disabled={!hasLocalData}
                  className="flex-1"
                >
                  {hasLocalData ? 'Start Migration' : 'No Data to Migrate'}
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              </>
            )}

            {result && (
              <Button onClick={onClose} className="w-full">
                Close
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 