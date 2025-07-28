"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@clerk/nextjs";
import { migrateLocalStorageToSupabase, checkMigrationStatus } from "@/lib/migration-utils";
import { toast } from "@/components/ui/use-toast";

interface MigrationStatus {
  hasMigrated: boolean;
  hasLocalData: boolean;
  migrationData?: any;
}

export default function StoredDataPage() {
  const { userId } = useAuth();
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [supabaseData, setSupabaseData] = useState<any>({});

  // Load migration status
  useEffect(() => {
    if (userId) {
      checkMigrationStatus(userId).then(setMigrationStatus);
    }
  }, [userId]);

  // Load Supabase data
  useEffect(() => {
    if (userId) {
      loadSupabaseData();
    }
  }, [userId]);

  const loadSupabaseData = async () => {
    try {
      // Load character stats
      const statsResponse = await fetch('/api/character-stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setSupabaseData((prev: any) => ({ ...prev, characterStats: statsData.data }));
      }

      // Load active perks
      const perksResponse = await fetch('/api/active-perks');
      if (perksResponse.ok) {
        const perksData = await perksResponse.json();
        setSupabaseData((prev: any) => ({ ...prev, activePerks: perksData.data }));
      }

      // Load game settings
      const settingsResponse = await fetch('/api/game-settings');
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        setSupabaseData((prev: any) => ({ ...prev, gameSettings: settingsData.data }));
      }
    } catch (error) {
      console.error('Error loading Supabase data:', error);
    }
  };

  const handleMigration = async () => {
    if (!userId) return;
    
    setIsMigrating(true);
    try {
      const result = await migrateLocalStorageToSupabase(userId);
      
      if (result.success) {
        toast({
          title: "Migration Successful",
          description: `Migrated: ${result.migrated.join(', ')}`,
        });
        // Reload data
        await loadSupabaseData();
        setMigrationStatus(await checkMigrationStatus(userId));
      } else {
        toast({
          title: "Migration Failed",
          description: `Errors: ${result.errors.join(', ')}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Migration Error",
        description: "An unexpected error occurred during migration.",
        variant: "destructive",
      });
    } finally {
      setIsMigrating(false);
    }
  };

  const handleTestMigration = async () => {
    if (!userId) return;
    
    setIsMigrating(true);
    try {
      const result = await migrateLocalStorageToSupabase(userId);
      
      toast({
        title: "Test Migration Complete",
        description: `Success: ${result.success}, Migrated: ${result.migrated.join(', ')}, Errors: ${result.errors.join(', ')}`,
      });
    } catch (error) {
      toast({
        title: "Test Migration Error",
        description: "An error occurred during test migration.",
        variant: "destructive",
      });
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <main className="container mx-auto p-4" aria-label="stored-data-section">
      <h1 className="text-2xl font-bold mb-4">Stored Data</h1>
      
      {/* Migration Status */}
      <Card className="mb-4" aria-label="migration-status-card">
        <CardHeader>
          <CardTitle>Migration Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant={migrationStatus?.hasLocalData ? "default" : "secondary"}>
                {migrationStatus?.hasLocalData ? "Has Local Data" : "No Local Data"}
              </Badge>
              <Badge variant={migrationStatus?.hasMigrated ? "default" : "secondary"}>
                {migrationStatus?.hasMigrated ? "Migrated" : "Not Migrated"}
              </Badge>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleMigration} 
                disabled={isMigrating || !migrationStatus?.hasLocalData}
                aria-label="Migrate data to Supabase"
              >
                {isMigrating ? "Migrating..." : "Migrate to Supabase"}
              </Button>
              
              <Button 
                onClick={handleTestMigration} 
                disabled={isMigrating}
                variant="outline"
                aria-label="Test migration process"
              >
                Test Migration
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Supabase Data */}
      <Card className="mb-4" aria-label="supabase-data-card">
        <CardHeader>
          <CardTitle>Supabase Data</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]" aria-label="supabase-data-scroll-area">
            <div className="space-y-4">
              {/* Character Stats */}
              <div>
                <h3 className="font-semibold mb-2">Character Stats</h3>
                <pre className="text-xs overflow-auto max-h-32 bg-gray-100 p-2 rounded">
                  {supabaseData.characterStats ? JSON.stringify(supabaseData.characterStats, null, 2) : 'No data found'}
                </pre>
              </div>

              {/* Active Perks */}
              <div>
                <h3 className="font-semibold mb-2">Active Perks</h3>
                <pre className="text-xs overflow-auto max-h-32 bg-gray-100 p-2 rounded">
                  {supabaseData.activePerks ? JSON.stringify(supabaseData.activePerks, null, 2) : 'No data found'}
                </pre>
              </div>

              {/* Game Settings */}
              <div>
                <h3 className="font-semibold mb-2">Game Settings</h3>
                <pre className="text-xs overflow-auto max-h-32 bg-gray-100 p-2 rounded">
                  {supabaseData.gameSettings ? JSON.stringify(supabaseData.gameSettings, null, 2) : 'No data found'}
                </pre>
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Local Data Preview */}
      {migrationStatus?.migrationData && (
        <Card aria-label="local-data-card">
          <CardHeader>
            <CardTitle>Local Data (To Be Migrated)</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]" aria-label="local-data-scroll-area">
              <pre className="text-xs overflow-auto bg-gray-100 p-2 rounded">
                {JSON.stringify(migrationStatus.migrationData, null, 2)}
              </pre>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </main>
  );
} 