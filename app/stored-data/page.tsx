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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Database, 
  Server, 
  Globe, 
  Shield, 
  Zap, 
  TrendingUp,
  Activity,
  Settings,
  Users,
  Gamepad2,
  Crown,
  Map,
  Sword,
  Trophy,
  Coins,
  Star
} from 'lucide-react';

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
  category: 'core' | 'gameplay' | 'social' | 'admin';
  priority: 'critical' | 'high' | 'medium' | 'low';
}

interface BuildStatus {
  overall: 'healthy' | 'warning' | 'error' | 'unknown';
  coreSystems: number;
  gameplayFeatures: number;
  socialFeatures: number;
  adminFeatures: number;
  totalSystems: number;
  workingSystems: number;
  brokenSystems: number;
  progress: number;
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
  const [buildStatus, setBuildStatus] = useState<BuildStatus>({
    overall: 'unknown',
    coreSystems: 0,
    gameplayFeatures: 0,
    socialFeatures: 0,
    adminFeatures: 0,
    totalSystems: 0,
    workingSystems: 0,
    brokenSystems: 0,
    progress: 0
  });
  
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

  // Calculate build status whenever connection statuses change
  useEffect(() => {
    if (connectionStatuses.length === 0) return;

    const working = connectionStatuses.filter(c => c.status === 'connected').length;
    const broken = connectionStatuses.filter(c => c.status === 'error').length;
    const total = connectionStatuses.length;
    const progress = (working / total) * 100;

    const coreSystems = connectionStatuses.filter(c => c.category === 'core' && c.status === 'connected').length;
    const gameplayFeatures = connectionStatuses.filter(c => c.category === 'gameplay' && c.status === 'connected').length;
    const socialFeatures = connectionStatuses.filter(c => c.category === 'social' && c.status === 'connected').length;
    const adminFeatures = connectionStatuses.filter(c => c.category === 'admin' && c.status === 'connected').length;

    let overall: 'healthy' | 'warning' | 'error' | 'unknown' = 'unknown';
    if (progress >= 90) overall = 'healthy';
    else if (progress >= 70) overall = 'warning';
    else overall = 'error';

    setBuildStatus({
      overall,
      coreSystems,
      gameplayFeatures,
      socialFeatures,
      adminFeatures,
      totalSystems: total,
      workingSystems: working,
      brokenSystems: broken,
      progress
    });
  }, [connectionStatuses]);

  const clearAllData = () => {
    localStorage.clear()
    sessionStorage.clear()
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'disconnected': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'disconnected': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'core': return <Database className="w-4 h-4" />;
      case 'gameplay': return <Gamepad2 className="w-4 h-4" />;
      case 'social': return <Users className="w-4 h-4" />;
      case 'admin': return <Settings className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const checkAllConnections = async () => {
    const connections: ConnectionStatus[] = [];
    const now = new Date().toISOString();

    // Core Systems (Critical)
    const coreApis = [
      { name: 'Character Stats', endpoint: '/api/character-stats', description: 'Character stats (gold, experience, level, health, etc.)', priority: 'critical' as const },
      { name: 'Authentication', endpoint: '/api/auth-test', description: 'User authentication and session management', priority: 'critical' as const },
      { name: 'Database Connection', endpoint: '/api/health', description: 'Supabase database connectivity', priority: 'critical' as const },
    ];

    // Gameplay Features (High Priority)
    const gameplayApis = [
      { name: 'Quests', endpoint: '/api/quests', description: 'Player quests and objectives', priority: 'high' as const },
      { name: 'Milestones', endpoint: '/api/milestones', description: 'Player milestones and progress tracking', priority: 'high' as const },
      { name: 'Challenges', endpoint: '/api/challenges', description: 'Player challenges and competitions', priority: 'high' as const },
      { name: 'Streaks', endpoint: '/api/streaks?category=test', description: 'Player streaks and consistency tracking', priority: 'high' as const },
      { name: 'Inventory', endpoint: '/api/inventory', description: 'Player inventory items and equipment', priority: 'high' as const },
      { name: 'Achievements', endpoint: '/api/achievements', description: 'Player achievements and progress', priority: 'high' as const },
      { name: 'Kingdom Grid', endpoint: '/api/kingdom-grid', description: 'Kingdom building grid and expansions', priority: 'high' as const },
      { name: 'Realm Grid', endpoint: `/api/data?type=grid&userId=${user?.id}`, description: 'Realm map grid and character position', priority: 'high' as const },
    ];

    // Social Features (Medium Priority)
    const socialApis = [
      { name: 'User Preferences', endpoint: '/api/user-preferences?preference_key=test', description: 'User preferences and settings', priority: 'medium' as const },
      { name: 'Notifications', endpoint: '/api/notifications', description: 'In-game notifications and alerts', priority: 'medium' as const },
      { name: 'Kingdom Events', endpoint: '/api/kingdom-events', description: 'Kingdom activities and events', priority: 'medium' as const },
    ];

    // Admin Features (Low Priority)
    const adminApis = [
      { name: 'Game Settings', endpoint: '/api/game-settings', description: 'User preferences and game configuration', priority: 'low' as const },
      { name: 'Active Perks', endpoint: '/api/active-perks', description: 'Active potion effects and temporary bonuses', priority: 'low' as const },
      { name: 'Tiles', endpoint: '/api/tiles', description: 'Tile placement and management', priority: 'low' as const },
      { name: 'Tile Inventory', endpoint: '/api/tile-inventory', description: 'Tile inventory and management', priority: 'low' as const },
      { name: 'Kingdom Stats', endpoint: '/api/kingdom-stats', description: 'Kingdom statistics and analytics', priority: 'low' as const },
      { name: 'Creatures', endpoint: '/api/creatures/discover', description: 'Creature discovery and management', priority: 'low' as const },
      { name: 'Progress', endpoint: '/api/progress/increment', description: 'Player progress tracking', priority: 'low' as const },
      { name: 'Realm Tiles', endpoint: '/api/realm-tiles', description: 'Realm tile management', priority: 'low' as const },
      { name: 'Character Perks', endpoint: '/api/character-perks', description: 'Character abilities and special powers', priority: 'low' as const },
      { name: 'Character Strengths', endpoint: '/api/character-strengths', description: 'Character attributes and stats', priority: 'low' as const },
      { name: 'Character Titles', endpoint: '/api/character-titles', description: 'Character achievements and titles', priority: 'low' as const },
      { name: 'Experience Transactions', endpoint: '/api/experience-transactions', description: 'Experience gain/loss tracking', priority: 'low' as const },
      { name: 'Gold Transactions', endpoint: '/api/gold-transactions', description: 'Gold economy and transactions', priority: 'low' as const },
      { name: 'Daily Tasks', endpoint: '/api/daily-tasks', description: 'Daily objectives and tasks', priority: 'low' as const },
      { name: 'Monster Spawns', endpoint: '/api/monster-spawns', description: 'Dynamic monster encounters', priority: 'low' as const },
    ];

    // Test all APIs
    const allApis = [
      ...coreApis.map(api => ({ ...api, category: 'core' as const })),
      ...gameplayApis.map(api => ({ ...api, category: 'gameplay' as const })),
      ...socialApis.map(api => ({ ...api, category: 'social' as const })),
      ...adminApis.map(api => ({ ...api, category: 'admin' as const }))
    ];

    for (const api of allApis) {
      try {
        const method = api.endpoint.includes('discover') || api.endpoint.includes('increment') ? 'POST' : 'GET';
        const body = method === 'POST' ? JSON.stringify({ test: true }) : null;
        const headers = method === 'POST' ? { 'Content-Type': 'application/json' } : {};

        const response = await fetch(api.endpoint, {
          method,
          headers,
          body,
          credentials: 'include'
        });

        connections.push({
          name: api.name,
          description: api.description,
          status: response.ok ? 'connected' : 'error',
          endpoint: api.endpoint,
          lastChecked: now,
          error: response.ok ? undefined : `HTTP ${response.status}`,
          category: api.category,
          priority: api.priority
        });
      } catch (error) {
        connections.push({
          name: api.name,
          description: api.description,
          status: 'error',
          endpoint: api.endpoint,
          lastChecked: now,
          error: error instanceof Error ? error.message : 'Unknown error',
          category: api.category,
          priority: api.priority
        });
      }
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
    <main className="container mx-auto p-4 space-y-6" aria-label="build-status-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Build Status Dashboard</h1>
          <p className="text-muted-foreground">Monitor your application&apos;s health and progress</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            variant={buildStatus.overall === 'healthy' ? 'default' : buildStatus.overall === 'warning' ? 'secondary' : 'destructive'}
            className="text-sm"
          >
            {buildStatus.overall.toUpperCase()}
          </Badge>
          <Button onClick={checkAllConnections} variant="outline" size="sm">
            Refresh Status
          </Button>
        </div>
      </div>

      {/* Overall Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Database className="w-4 h-4" />
              Core Systems
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{buildStatus.coreSystems}</div>
            <Progress value={(buildStatus.coreSystems / 3) * 100} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">3 total systems</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Gamepad2 className="w-4 h-4" />
              Gameplay Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{buildStatus.gameplayFeatures}</div>
            <Progress value={(buildStatus.gameplayFeatures / 8) * 100} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">8 total features</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4" />
              Social Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{buildStatus.socialFeatures}</div>
            <Progress value={(buildStatus.socialFeatures / 3) * 100} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">3 total features</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Settings className="w-4 h-4" />
              Admin Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{buildStatus.adminFeatures}</div>
            <Progress value={(buildStatus.adminFeatures / 15) * 100} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">15 total features</p>
          </CardContent>
        </Card>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Overall Build Progress
          </CardTitle>
          <CardDescription>
            {buildStatus.workingSystems} of {buildStatus.totalSystems} systems working ({buildStatus.progress.toFixed(1)}%)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">System Health</span>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="text-xs">
                  {buildStatus.workingSystems} Working
                </Badge>
                <Badge variant="destructive" className="text-xs">
                  {buildStatus.brokenSystems} Broken
                </Badge>
              </div>
            </div>
            <Progress value={buildStatus.progress} className="h-3" />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Critical Issues Alert */}
      {connectionStatuses.filter(c => c.priority === 'critical' && c.status === 'error').length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Critical Issues Detected!</strong> {connectionStatuses.filter(c => c.priority === 'critical' && c.status === 'error').length} critical systems are down. 
            This may affect core functionality.
          </AlertDescription>
        </Alert>
      )}

      {/* System Status by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Core Systems */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Core Systems
            </CardTitle>
            <CardDescription>Essential systems for application functionality</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {connectionStatuses
                .filter(c => c.category === 'core')
                .sort((a, b) => a.priority.localeCompare(b.priority))
                .map((connection, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(connection.status)}
                      <div>
                        <div className="font-medium">{connection.name}</div>
                        <div className="text-sm text-muted-foreground">{connection.description}</div>
                      </div>
                    </div>
                    <Badge variant="outline" className={getPriorityColor(connection.priority)}>
                      {connection.priority}
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Gameplay Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gamepad2 className="w-5 h-5" />
              Gameplay Features
            </CardTitle>
            <CardDescription>Core game mechanics and player interactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {connectionStatuses
                .filter(c => c.category === 'gameplay')
                .sort((a, b) => a.priority.localeCompare(b.priority))
                .map((connection, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(connection.status)}
                      <div>
                        <div className="font-medium">{connection.name}</div>
                        <div className="text-sm text-muted-foreground">{connection.description}</div>
                      </div>
                    </div>
                    <Badge variant="outline" className={getPriorityColor(connection.priority)}>
                      {connection.priority}
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Social Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Social Features
            </CardTitle>
            <CardDescription>User interaction and community features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {connectionStatuses
                .filter(c => c.category === 'social')
                .sort((a, b) => a.priority.localeCompare(b.priority))
                .map((connection, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(connection.status)}
                      <div>
                        <div className="font-medium">{connection.name}</div>
                        <div className="text-sm text-muted-foreground">{connection.description}</div>
                      </div>
                    </div>
                    <Badge variant="outline" className={getPriorityColor(connection.priority)}>
                      {connection.priority}
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Admin Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Admin Features
            </CardTitle>
            <CardDescription>Administrative and utility features</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {connectionStatuses
                  .filter(c => c.category === 'admin')
                  .sort((a, b) => a.priority.localeCompare(b.priority))
                  .map((connection, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(connection.status)}
                        <div>
                          <div className="font-medium">{connection.name}</div>
                          <div className="text-sm text-muted-foreground">{connection.description}</div>
                        </div>
                      </div>
                      <Badge variant="outline" className={getPriorityColor(connection.priority)}>
                        {connection.priority}
                      </Badge>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Error Log */}
      {connectionStatuses.filter(c => c.status === 'error').length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Error Details
            </CardTitle>
            <CardDescription>Detailed information about system failures</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-3">
                {connectionStatuses
                  .filter(c => c.status === 'error')
                  .map((connection, index) => (
                    <div key={index} className="p-3 border border-red-200 rounded-lg bg-red-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-red-800">{connection.name}</div>
                        <Badge variant="destructive" className="text-xs">
                          {connection.priority}
                        </Badge>
                      </div>
                      <div className="text-sm text-red-700 mb-1">{connection.description}</div>
                      <div className="text-xs text-red-600">
                        <div>Endpoint: {connection.endpoint}</div>
                        <div>Error: {connection.error}</div>
                        <div>Last Checked: {connection.lastChecked ? new Date(connection.lastChecked).toLocaleString() : 'Never'}</div>
                      </div>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Legacy Components */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MigrationStatus />
        <HealthCheck />
      </div>

      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Test Controls</CardTitle>
          <CardDescription>Development and testing utilities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Title Evolution Tests</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                <Button onClick={triggerTestModal} variant="outline" size="sm" className="text-xs">
                  Squire → Knight
                </Button>
                <Button onClick={triggerTestModal2} variant="outline" size="sm" className="text-xs">
                  Knight → Baron
                </Button>
                <Button onClick={triggerTestModal3} variant="outline" size="sm" className="text-xs">
                  Baron → Viscount
                </Button>
                <Button onClick={triggerTestModal4} variant="outline" size="sm" className="text-xs">
                  Viscount → Count
                </Button>
                <Button onClick={triggerTestModal5} variant="outline" size="sm" className="text-xs">
                  Count → Marquis
                </Button>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex gap-2">
              <Button onClick={handleMigration} disabled={isMigrating} variant="outline">
                {isMigrating ? "Migrating..." : "Migrate Data"}
              </Button>
              <Button onClick={handleTestMigration} disabled={isMigrating} variant="outline">
                Test Migration
              </Button>
              <Button onClick={clearAllData} variant="destructive">
                Clear All Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
} 