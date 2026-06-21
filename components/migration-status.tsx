'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { DataMigration } from '@/lib/data-migration'
import type { MigrationStatus } from '@/lib/data-migration'
import { useSupabaseSync } from '@/hooks/use-supabase-sync'
import { Database, Upload, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react'

export function MigrationStatus() {
  const [status, setStatus] = useState<MigrationStatus>({
    isRunning: false,
    progress: 0,
    total: 0,
    current: ''
  })
  const [needsMigration, setNeedsMigration] = useState(false)
  const [migrationSummary, setMigrationSummary] = useState<{ totalItems: number; items: string[] }>({ totalItems: 0, items: [] })
  const { toast } = useToast()
  const { isSignedIn, isSyncing } = useSupabaseSync()

  const migration = DataMigration.getInstance()

  useEffect(() => {
    // Check if migration is needed
    setNeedsMigration(DataMigration.needsMigration())
    setMigrationSummary(DataMigration.getMigrationSummary())

    // Update status periodically
    const interval = setInterval(() => {
      setStatus(migration.getStatus())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const handleMigration = async () => {
    try {
      await migration.migrateAllData()
      toast({
        title: "Migration Complete",
        description: "Your data has been successfully migrated to the cloud.",
        variant: "default"
      })
      setNeedsMigration(false)
      setMigrationSummary(DataMigration.getMigrationSummary())
    } catch (error) {
      toast({
        title: "Migration Failed",
        description: error instanceof Error ? error.message : "An error occurred during migration.",
        variant: "destructive"
      })
    }
  }

  if (!isSignedIn) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Sync Status
          </CardTitle>
          <CardDescription>
            Sign in to enable cross-device data synchronization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You need to sign in to sync your data across devices.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Data Sync Status
        </CardTitle>
        <CardDescription>
          {needsMigration 
            ? "You have local data that can be migrated to the cloud for cross-device sync"
            : "Your data is synced across devices"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sync Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Sync Status</span>
          <Badge variant={isSyncing ? "secondary" : "default"}>
            {isSyncing ? (
              <>
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                Synced
              </>
            )}
          </Badge>
        </div>

        {/* Migration Status */}
        {needsMigration && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Local Data</span>
              <Badge variant="outline">
                {migrationSummary.totalItems} items
              </Badge>
            </div>

            {status.isRunning && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Migration Progress</span>
                  <span>{status.progress}/{status.total}</span>
                </div>
                <Progress value={(status.progress / status.total) * 100} />
                <p className="text-xs text-muted-foreground">{status.current}</p>
                {status.error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{status.error}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {!status.isRunning && (
              <div className="space-y-2">
                <Alert>
                  <Upload className="h-4 w-4" />
                  <AlertDescription>
                    You have {migrationSummary.totalItems} items stored locally that can be migrated to the cloud for cross-device synchronization.
                  </AlertDescription>
                </Alert>
                <Button 
                  onClick={handleMigration} 
                  disabled={status.isRunning}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Migrate to Cloud
                </Button>
              </div>
            )}
          </>
        )}

        {/* Data Summary */}
        {!needsMigration && migrationSummary.totalItems > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Synced Data</span>
              <Badge variant="default">
                {migrationSummary.totalItems} items
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Your data is automatically synced across all your devices.
            </p>
          </div>
        )}

        {/* No Data */}
        {!needsMigration && migrationSummary.totalItems === 0 && (
          <div className="text-center py-4">
            <Database className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No data to sync yet. Start using the app to see your data here.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 