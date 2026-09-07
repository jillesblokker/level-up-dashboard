'use client'

import { logger } from "@/lib/logger";
;

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
      logger.error('Migration error:', error);
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
    <div className="fixed inset-0 bg-zinc-950 flex items-center justify-center z-50 p-4">
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
              <h4 className="font-medium text-xs text-zinc-300">Local data detected:</h4>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                {localData.gridData && (
                  <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Grid & map data
                  </div>
                )}
                {localData.characterPosition && (
                  <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Character position
                  </div>
                )}
                {localData.tileInventory && (
                  <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Tile inventory
                  </div>
                )}
                {localData.userPreferences && (
                  <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> User preferences
                  </div>
                )}
                {localData.imageDescriptions && (
                  <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Image descriptions
                  </div>
                )}
                {localData.gameSettings && (
                  <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Game settings
                  </div>
                )}
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

          {/* Progress */}
          {isMigrating && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Migrating data...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-3">
              {result.success ? (
                <Alert className="border-green-200 bg-green-50 text-green-800">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    Migration completed successfully!
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-red-200 bg-red-50 text-red-800">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription>
                    Migration completed with errors. Check details below.
                  </AlertDescription>
                </Alert>
              )}

              {result.migrated.length > 0 && (
                <div className="text-xs space-y-1.5">
                  <div className="font-medium text-emerald-400">Migrated items:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {result.migrated.map(item => (
                      <span key={item} className="px-2 py-0.5 rounded-md bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono">
                        ✓ {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.errors.length > 0 && (
                <div className="text-xs space-y-1.5 text-red-400">
                  <div className="font-medium">Errors:</div>
                  <div className="space-y-1">
                    {result.errors.map((error, index) => (
                      <div key={index} className="p-1.5 rounded bg-red-950/30 border border-red-500/20 text-[11px]">
                        {error}
                      </div>
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