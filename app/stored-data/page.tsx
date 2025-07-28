"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { MigrationStatus } from '@/components/migration-status'
import { HealthCheck } from '@/components/health-check'
import { useSupabase } from '@/lib/hooks/useSupabase';
import { useAuth, useUser } from '@clerk/nextjs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { getCharacterStats } from '@/lib/character-stats-manager';
import { useTitleEvolution } from '@/hooks/title-evolution-context'
import { migrateLocalStorageToSupabase, checkMigrationStatus } from '@/lib/migration-utils';

interface SupabaseData {
  table: string;
  count: number;
  lastUpdated: string;
}

export default function StoredDataPage() {
  const [supabaseData, setSupabaseData] = useState<SupabaseData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [characterStats, setCharacterStats] = useState<any>(null);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [migrationStatus, setMigrationStatus] = useState<any>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  
  const { user } = useUser();
  const { supabase } = useSupabase();
  const { triggerTestModal, triggerTestModal2, triggerTestModal3, triggerTestModal4, triggerTestModal5, triggerTestModal6, triggerTestModal7, triggerTestModal8, triggerTestModal9, triggerTestModal10 } = useTitleEvolution()

  useEffect(() => {
    async function loadSupabaseData() {
      if (!user?.id || !supabase) return;
      
      setIsLoading(true);
      try {
        // Load character stats
        const stats = getCharacterStats();
        setCharacterStats(stats);

        // Load inventory (using direct API call)
        try {
          const inventoryResponse = await fetch('/api/inventory', {
            credentials: 'include'
          });
          if (inventoryResponse.ok) {
            const inventory = await inventoryResponse.json();
            setInventoryItems(inventory || []);
          }
        } catch (error) {
          console.error('Error loading inventory:', error);
        }

        // Load achievements (using direct API call)
        try {
          const achievementsResponse = await fetch('/api/achievements', {
            credentials: 'include'
          });
          if (achievementsResponse.ok) {
            const userAchievements = await achievementsResponse.json();
            setAchievements(userAchievements || []);
          }
        } catch (error) {
          console.error('Error loading achievements:', error);
        }

        // Set summary data
        setSupabaseData([
          { table: 'Character Stats', count: stats ? 1 : 0, lastUpdated: new Date().toISOString() },
          { table: 'Inventory Items', count: inventoryItems?.length || 0, lastUpdated: new Date().toISOString() },
          { table: 'Achievements', count: achievements?.length || 0, lastUpdated: new Date().toISOString() },
        ]);

        // Load migration status
        const status = await checkMigrationStatus(user.id);
        setMigrationStatus(status);
      } catch (error) {
        console.error('Error loading Supabase data:', error);
        toast.error('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    }

    loadSupabaseData();
  }, [user?.id, supabase]);

  const clearAllData = () => {
    localStorage.clear()
    sessionStorage.clear()
  }

  const handleMigration = async () => {
    if (!user?.id) return;
    
    setIsMigrating(true);
    try {
      const result = await migrateLocalStorageToSupabase(user.id);
      
      if (result.success) {
        toast.success(`Migration Successful: ${result.migrated.join(', ')}`);
        // Reload data
        window.location.reload();
      } else {
        toast.error(`Migration Failed: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      toast.error('An unexpected error occurred during migration.');
    } finally {
      setIsMigrating(false);
    }
  };

  const handleTestMigration = async () => {
    if (!user?.id) return;
    
    setIsMigrating(true);
    try {
      const result = await migrateLocalStorageToSupabase(user.id);
      
      toast.info(`Test Migration Complete: Success: ${result.success}, Migrated: ${result.migrated.join(', ')}, Errors: ${result.errors.join(', ')}`);
    } catch (error) {
      toast.error('An error occurred during test migration.');
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <main className="container mx-auto p-4" aria-label="stored-data-section">
      <h1 className="text-2xl font-bold mb-4">Stored Data (Supabase)</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-4" aria-label="supabase-data-card">
          <CardHeader>
            <CardTitle>Supabase Data Overview</CardTitle>
            <CardDescription>Your data stored in Supabase</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div>Loading...</div>
            ) : (
              <ScrollArea className="h-[300px]" aria-label="supabase-data-scroll-area">
                {supabaseData.map((item) => (
                  <div key={item.table} className="flex justify-between items-center p-2 border-b">
                    <span className="font-medium">{item.table}</span>
                    <Badge variant="secondary">{item.count} items</Badge>
                  </div>
                ))}
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <Card className="p-4" aria-label="character-stats-card">
          <CardHeader>
            <CardTitle>Character Stats</CardTitle>
          </CardHeader>
          <CardContent>
            {characterStats ? (
              <div className="space-y-2">
                <p>Level: {characterStats.level}</p>
                <p>Gold: {characterStats.gold}</p>
                <p>Experience: {characterStats.experience}</p>
              </div>
            ) : (
              <p>No character stats found</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Migration Section */}
      <div className="mt-6">
        <Card className="p-4" aria-label="migration-status-card">
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
      </div>

      <div className="mt-6">
        <MigrationStatus />
      </div>
      
      <div className="mt-6">
        <HealthCheck />
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-4">Test Title Evolution Modal</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          <Button onClick={triggerTestModal} variant="outline" className="text-xs">
            Squire → Knight (L10)
          </Button>
          <Button onClick={triggerTestModal2} variant="outline" className="text-xs">
            Knight → Baron (L20)
          </Button>
          <Button onClick={triggerTestModal3} variant="outline" className="text-xs">
            Baron → Viscount (L30)
          </Button>
          <Button onClick={triggerTestModal4} variant="outline" className="text-xs">
            Viscount → Count (L40)
          </Button>
          <Button onClick={triggerTestModal5} variant="outline" className="text-xs">
            Count → Marquis (L50)
          </Button>
          <Button onClick={triggerTestModal6} variant="outline" className="text-xs">
            Marquis → Duke (L60)
          </Button>
          <Button onClick={triggerTestModal7} variant="outline" className="text-xs">
            Duke → Prince (L70)
          </Button>
          <Button onClick={triggerTestModal8} variant="outline" className="text-xs">
            Prince → King (L80)
          </Button>
          <Button onClick={triggerTestModal9} variant="outline" className="text-xs">
            King → Emperor (L90)
          </Button>
          <Button onClick={triggerTestModal10} variant="outline" className="text-xs">
            Emperor → God (L100)
          </Button>
        </div>
      </div>

      <div className="mt-6">
        <Button onClick={clearAllData} variant="destructive">
          Clear All Data
        </Button>
      </div>
    </main>
  );
} 