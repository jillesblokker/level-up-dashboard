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

interface ConnectionStatus {
  name: string;
  description: string;
  status: 'connected' | 'disconnected' | 'error' | 'unknown';
  endpoint?: string;
  lastChecked?: string;
  error?: string | undefined;
}

export default function StoredDataPage() {
  const [supabaseData, setSupabaseData] = useState<SupabaseData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [characterStats, setCharacterStats] = useState<any>(null);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [migrationStatus, setMigrationStatus] = useState<any>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [connectionStatuses, setConnectionStatuses] = useState<ConnectionStatus[]>([]);
  
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

        // Check all Supabase connections
        await checkAllConnections();
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

  const checkAllConnections = async () => {
    const connections: ConnectionStatus[] = [];
    const now = new Date().toISOString();

    // 1. Character Stats API
    try {
      const response = await fetch('/api/character-stats', {
        credentials: 'include'
      });
      connections.push({
        name: 'Character Stats',
        description: 'Character stats (gold, experience, level, health, etc.)',
        status: response.ok ? 'connected' : 'error',
        endpoint: '/api/character-stats',
        lastChecked: now,
        error: response.ok ? undefined : `HTTP ${response.status}`
      });
    } catch (error) {
      connections.push({
        name: 'Character Stats',
        description: 'Character stats (gold, experience, level, health, etc.)',
        status: 'error',
        endpoint: '/api/character-stats',
        lastChecked: now,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // 2. Inventory API
    try {
      const response = await fetch('/api/inventory', {
        credentials: 'include'
      });
      connections.push({
        name: 'Inventory',
        description: 'Player inventory items and equipment',
        status: response.ok ? 'connected' : 'error',
        endpoint: '/api/inventory',
        lastChecked: now,
        error: response.ok ? undefined : `HTTP ${response.status}`
      });
    } catch (error) {
      connections.push({
        name: 'Inventory',
        description: 'Player inventory items and equipment',
        status: 'error',
        endpoint: '/api/inventory',
        lastChecked: now,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // 3. Achievements API
    try {
      const response = await fetch('/api/achievements', {
        credentials: 'include'
      });
      connections.push({
        name: 'Achievements',
        description: 'Player achievements and progress',
        status: response.ok ? 'connected' : 'error',
        endpoint: '/api/achievements',
        lastChecked: now,
        error: response.ok ? undefined : `HTTP ${response.status}`
      });
    } catch (error) {
      connections.push({
        name: 'Achievements',
        description: 'Player achievements and progress',
        status: 'error',
        endpoint: '/api/achievements',
        lastChecked: now,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // 4. Active Perks API
    try {
      const response = await fetch('/api/active-perks', {
        credentials: 'include'
      });
      connections.push({
        name: 'Active Perks',
        description: 'Active potion effects and temporary bonuses',
        status: response.ok ? 'connected' : 'error',
        endpoint: '/api/active-perks',
        lastChecked: now,
        error: response.ok ? undefined : `HTTP ${response.status}`
      });
    } catch (error) {
      connections.push({
        name: 'Active Perks',
        description: 'Active potion effects and temporary bonuses',
        status: 'error',
        endpoint: '/api/active-perks',
        lastChecked: now,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // 5. Game Settings API
    try {
      const response = await fetch('/api/game-settings', {
        credentials: 'include'
      });
      connections.push({
        name: 'Game Settings',
        description: 'User preferences and game configuration',
        status: response.ok ? 'connected' : 'error',
        endpoint: '/api/game-settings',
        lastChecked: now,
        error: response.ok ? undefined : `HTTP ${response.status}`
      });
    } catch (error) {
      connections.push({
        name: 'Game Settings',
        description: 'User preferences and game configuration',
        status: 'error',
        endpoint: '/api/game-settings',
        lastChecked: now,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // 6. Realm Grid API
    try {
      const response = await fetch(`/api/data?type=grid&userId=${user?.id}`, {
        credentials: 'include'
      });
      connections.push({
        name: 'Realm Grid',
        description: 'Realm map grid and character position',
        status: response.ok ? 'connected' : 'error',
        endpoint: `/api/data?type=grid&userId=${user?.id}`,
        lastChecked: now,
        error: response.ok ? undefined : `HTTP ${response.status}`
      });
    } catch (error) {
      connections.push({
        name: 'Realm Grid',
        description: 'Realm map grid and character position',
        status: 'error',
        endpoint: `/api/data?type=grid&userId=${user?.id}`,
        lastChecked: now,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // 7. Kingdom Grid API
    try {
      const response = await fetch('/api/kingdom-grid', {
        credentials: 'include'
      });
      connections.push({
        name: 'Kingdom Grid',
        description: 'Kingdom building grid and expansions',
        status: response.ok ? 'connected' : 'error',
        endpoint: '/api/kingdom-grid',
        lastChecked: now,
        error: response.ok ? undefined : `HTTP ${response.status}`
      });
    } catch (error) {
      connections.push({
        name: 'Kingdom Grid',
        description: 'Kingdom building grid and expansions',
        status: 'error',
        endpoint: '/api/kingdom-grid',
        lastChecked: now,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // 8. Quests API
    try {
      const response = await fetch('/api/quests', {
        credentials: 'include'
      });
      connections.push({
        name: 'Quests',
        description: 'Player quests and objectives',
        status: response.ok ? 'connected' : 'error',
        endpoint: '/api/quests',
        lastChecked: now,
        error: response.ok ? undefined : `HTTP ${response.status}`
      });
    } catch (error) {
      connections.push({
        name: 'Quests',
        description: 'Player quests and objectives',
        status: 'error',
        endpoint: '/api/quests',
        lastChecked: now,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // 9. Milestones API
    try {
      const response = await fetch('/api/milestones', {
        credentials: 'include'
      });
      connections.push({
        name: 'Milestones',
        description: 'Player milestones and progress tracking',
        status: response.ok ? 'connected' : 'error',
        endpoint: '/api/milestones',
        lastChecked: now,
        error: response.ok ? undefined : `HTTP ${response.status}`
      });
    } catch (error) {
      connections.push({
        name: 'Milestones',
        description: 'Player milestones and progress tracking',
        status: 'error',
        endpoint: '/api/milestones',
        lastChecked: now,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // 10. Challenges API
    try {
      const response = await fetch('/api/challenges', {
        credentials: 'include'
      });
      connections.push({
        name: 'Challenges',
        description: 'Player challenges and competitions',
        status: response.ok ? 'connected' : 'error',
        endpoint: '/api/challenges',
        lastChecked: now,
        error: response.ok ? undefined : `HTTP ${response.status}`
      });
    } catch (error) {
      connections.push({
        name: 'Challenges',
        description: 'Player challenges and competitions',
        status: 'error',
        endpoint: '/api/challenges',
        lastChecked: now,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // 11. Tiles API
    try {
      const response = await fetch('/api/tiles', {
        credentials: 'include'
      });
      connections.push({
        name: 'Tiles',
        description: 'Tile placement and management',
        status: response.ok ? 'connected' : 'error',
        endpoint: '/api/tiles',
        lastChecked: now,
        error: response.ok ? undefined : `HTTP ${response.status}`
      });
    } catch (error) {
      connections.push({
        name: 'Tiles',
        description: 'Tile placement and management',
        status: 'error',
        endpoint: '/api/tiles',
        lastChecked: now,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // 12. Tile Inventory API
    try {
      const response = await fetch('/api/tile-inventory', {
        credentials: 'include'
      });
      connections.push({
        name: 'Tile Inventory',
        description: 'Tile inventory and management',
        status: response.ok ? 'connected' : 'error',
        endpoint: '/api/tile-inventory',
        lastChecked: now,
        error: response.ok ? undefined : `HTTP ${response.status}`
      });
    } catch (error) {
      connections.push({
        name: 'Tile Inventory',
        description: 'Tile inventory and management',
        status: 'error',
        endpoint: '/api/tile-inventory',
        lastChecked: now,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // 13. Kingdom Stats API
    try {
      const response = await fetch('/api/kingdom-stats', {
        credentials: 'include'
      });
      connections.push({
        name: 'Kingdom Stats',
        description: 'Kingdom statistics and analytics',
        status: response.ok ? 'connected' : 'error',
        endpoint: '/api/kingdom-stats',
        lastChecked: now,
        error: response.ok ? undefined : `HTTP ${response.status}`
      });
    } catch (error) {
      connections.push({
        name: 'Kingdom Stats',
        description: 'Kingdom statistics and analytics',
        status: 'error',
        endpoint: '/api/kingdom-stats',
        lastChecked: now,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // 14. User Preferences API
    try {
      const response = await fetch('/api/user-preferences?preference_key=test', {
        credentials: 'include'
      });
      connections.push({
        name: 'User Preferences',
        description: 'User preferences and settings',
        status: response.ok ? 'connected' : 'error',
        endpoint: '/api/user-preferences',
        lastChecked: now,
        error: response.ok ? undefined : `HTTP ${response.status}`
      });
    } catch (error) {
      connections.push({
        name: 'User Preferences',
        description: 'User preferences and settings',
        status: 'error',
        endpoint: '/api/user-preferences',
        lastChecked: now,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // 15. Creatures API
    try {
      const response = await fetch('/api/creatures/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatureId: 'test' }),
        credentials: 'include'
      });
      connections.push({
        name: 'Creatures',
        description: 'Creature discovery and management',
        status: response.ok ? 'connected' : 'error',
        endpoint: '/api/creatures/discover',
        lastChecked: now,
        error: response.ok ? undefined : `HTTP ${response.status}`
      });
    } catch (error) {
      connections.push({
        name: 'Creatures',
        description: 'Creature discovery and management',
        status: 'error',
        endpoint: '/api/creatures/discover',
        lastChecked: now,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // 16. Progress API
    try {
      const response = await fetch('/api/progress/increment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test' }),
        credentials: 'include'
      });
      connections.push({
        name: 'Progress',
        description: 'Player progress tracking',
        status: response.ok ? 'connected' : 'error',
        endpoint: '/api/progress/increment',
        lastChecked: now,
        error: response.ok ? undefined : `HTTP ${response.status}`
      });
    } catch (error) {
      connections.push({
        name: 'Progress',
        description: 'Player progress tracking',
        status: 'error',
        endpoint: '/api/progress/increment',
        lastChecked: now,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // 17. Realm Tiles API
    try {
      const response = await fetch('/api/realm-tiles', {
        credentials: 'include'
      });
      connections.push({
        name: 'Realm Tiles',
        description: 'Realm tile management',
        status: response.ok ? 'connected' : 'error',
        endpoint: '/api/realm-tiles',
        lastChecked: now,
        error: response.ok ? undefined : `HTTP ${response.status}`
      });
    } catch (error) {
      connections.push({
        name: 'Realm Tiles',
        description: 'Realm tile management',
        status: 'error',
        endpoint: '/api/realm-tiles',
        lastChecked: now,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // 18. Streaks API
    try {
      const response = await fetch('/api/streaks?category=test', {
        credentials: 'include'
      });
      connections.push({
        name: 'Streaks',
        description: 'Player streaks and consistency tracking',
        status: response.ok ? 'connected' : 'error',
        endpoint: '/api/streaks?category=test',
        lastChecked: now,
        error: response.ok ? undefined : `HTTP ${response.status}`
      });
    } catch (error) {
      connections.push({
        name: 'Streaks',
        description: 'Player streaks and consistency tracking',
        status: 'error',
        endpoint: '/api/streaks?category=test',
        lastChecked: now,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    setConnectionStatuses(connections);
  };

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

      {/* Supabase Connection Status */}
      <div className="mt-6">
        <Card className="p-4" aria-label="connection-status-card">
          <CardHeader>
            <CardTitle>Supabase Connection Status</CardTitle>
            <CardDescription>Check if all database connections are working properly</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button 
                onClick={checkAllConnections} 
                variant="outline"
                aria-label="Check all Supabase connections"
              >
                Refresh Connection Status
              </Button>
              
              <ScrollArea className="h-[400px]" aria-label="connection-status-scroll-area">
                <div className="space-y-3">
                  {connectionStatuses.map((connection, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{connection.name}</h4>
                        <Badge 
                          variant={
                            connection.status === 'connected' ? 'default' : 
                            connection.status === 'error' ? 'destructive' : 
                            'secondary'
                          }
                        >
                          {connection.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{connection.description}</p>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>Endpoint: {connection.endpoint}</p>
                        <p>Last Checked: {connection.lastChecked ? new Date(connection.lastChecked).toLocaleString() : 'Never'}</p>
                        {connection.error && (
                          <p className="text-red-500">Error: {connection.error}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
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