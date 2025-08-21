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
import { RARE_TILES, unlockRareTile, clearRareTileUnlock } from '@/lib/rare-tiles-manager';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
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

// New interface for data comparison
interface DataComparison {
  table: string;
  localStorageCount: number;
  supabaseCount: number;
  difference: number;
  status: 'synced' | 'local-ahead' | 'supabase-ahead' | 'error';
  lastChecked: string;
}

export default function AdminPage() {
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
  
  // New state for data comparison
  const [dataComparison, setDataComparison] = useState<DataComparison[]>([]);
  const [isComparingData, setIsComparingData] = useState(false);

  const { user } = useUser();
  const { getToken } = useAuth();
  const { supabase } = useSupabase();
  const { triggerTestModal, triggerTestModal2, triggerTestModal3, triggerTestModal4, triggerTestModal5, triggerTestModal6, triggerTestModal7, triggerTestModal8, triggerTestModal9, triggerTestModal10 } = useTitleEvolution()

  // Event toggle states
  const [winterFestivalActive, setWinterFestivalActive] = useState(false);
  const [harvestFestivalActive, setHarvestFestivalActive] = useState(false);
  const [isUpdatingEvents, setIsUpdatingEvents] = useState(false);

  const handleUnlockRareTile = async (tileId: string) => {
    try {
      if (!user?.id || !supabase) {
        toast.error('User not authenticated or Supabase not available');
        return;
      }

      await unlockRareTile(supabase, user.id, tileId);
      
      // Dispatch custom event to update UI
      window.dispatchEvent(new CustomEvent('rare-tile-unlocked', { detail: { tileId } }));
      
      toast.success(`Unlocked ${tileId}`, {
        style: {
          backgroundColor: '#059669',
          color: '#ffffff',
          border: '1px solid #047857'
        }
      });
    } catch (error) {
      console.error('Error unlocking rare tile:', error);
      toast.error('Failed to unlock rare tile', {
        style: {
          backgroundColor: '#dc2626',
          color: '#ffffff',
          border: '1px solid #b91c1c'
        }
      });
    }
  };

  const handleClearRareTile = async (tileId: string) => {
    try {
      if (!user?.id || !supabase) {
        toast.error('User not authenticated or Supabase not available');
        return;
      }

      await clearRareTileUnlock(supabase, user.id, tileId);
      
      // Dispatch custom event to update UI
      window.dispatchEvent(new CustomEvent('rare-tile-cleared', { detail: { tileId } }));
      
      toast.success(`Cleared ${tileId}`, {
        style: {
          backgroundColor: '#059669',
          color: '#ffffff',
          border: '1px solid #047857'
        }
      });
    } catch (error) {
      console.error('Error clearing rare tile:', error);
      toast.error('Failed to clear rare tile', {
        style: {
          backgroundColor: '#dc2626',
          color: '#ffffff',
          border: '1px solid #b91c1c'
        }
      });
    }
  };

  // 🎯 NEW: Sync data FROM Supabase TO localStorage
  const syncDataToLocalStorage = async () => {
    try {
      setIsLoading(true);
      
      // 1. Sync Quest Completions
      const questResponse = await fetch('/api/quests/simple');
      if (questResponse.ok) {
        const questData = await questResponse.json();
        const completedQuests = questData.completedQuests || [];
        
        // Store in localStorage
        localStorage.setItem('questCompletions', JSON.stringify(completedQuests));
        console.log('[Admin] Synced', completedQuests.length, 'quest completions to localStorage');
      }
      
      // 2. Sync Gold Transactions
      const goldResponse = await fetch('/api/gold-transactions');
      if (goldResponse.ok) {
        const goldData = await goldResponse.json();
        const goldTransactions = goldData.data || [];
        
        // Store in localStorage
        localStorage.setItem('goldTransactions', JSON.stringify(goldTransactions));
        console.log('[Admin] Synced', goldTransactions.length, 'gold transactions to localStorage');
      } else {
        console.error('[Admin] Gold API failed:', goldResponse.status);
      }
      
      // 3. Sync Experience Transactions
      const expResponse = await fetch('/api/experience-transactions');
      if (expResponse.ok) {
        const expData = await expResponse.json();
        const expTransactions = expData.data || [];
        
        // Store in localStorage
        const expDataToStore = expTransactions.map((tx: any) => ({
          id: tx.id,
          amount: tx.amount,
          type: tx.type,
          timestamp: tx.timestamp,
          source: tx.source
        }));
        
        localStorage.setItem('experienceTransactions', JSON.stringify(expDataToStore));
        console.log('[Admin] Synced', expTransactions.length, 'experience transactions to localStorage');
      } else {
        console.error('[Admin] Experience API failed:', expResponse.status);
      }
      
      // 4. Sync Inventory Items
      const inventoryResponse = await fetch('/api/inventory');
      if (inventoryResponse.ok) {
        const inventoryData = await inventoryResponse.json();
        const inventoryItems = inventoryData || [];
        
        // Store in localStorage
        localStorage.setItem('inventory', JSON.stringify(inventoryItems));
        console.log('[Admin] Synced', inventoryItems.length, 'inventory items to localStorage');
      } else {
        console.error('[Admin] Inventory API failed:', inventoryResponse.status);
      }
      
      toast.success('Data synced to localStorage successfully!', {
        style: {
          backgroundColor: '#059669',
          color: '#ffffff',
          border: '1px solid #047857'
        }
      });
      
      // Force refresh the data comparison immediately
      await compareDataSources();
      
      // Also refresh the page data
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error('[Admin] Error syncing data:', error);
      toast.error('Failed to sync data to localStorage', {
        style: {
          backgroundColor: '#dc2626',
          color: '#ffffff',
          border: '1px solid #b91c1c'
        }
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // 🎯 NEW: Auto-sync missing data to localStorage
  const autoSyncMissingData = async () => {
    try {
      console.log('[Admin] Auto-syncing missing data...');
      
      // Auto-sync quest completions if missing
      const localStorageQuests = JSON.parse(localStorage.getItem('questCompletions') || '[]');
      if (localStorageQuests.length === 0) {
        console.log('[Admin] Auto-syncing quest completions...');
        const questResponse = await fetch('/api/quests/simple');
        if (questResponse.ok) {
          const questData = await questResponse.json();
          const completedQuests = questData.completedQuests || [];
          localStorage.setItem('questCompletions', JSON.stringify(completedQuests));
          console.log('[Admin] Auto-synced', completedQuests.length, 'quest completions');
        }
      }
      
      // Auto-sync inventory if missing
      const localStorageInventory = JSON.parse(localStorage.getItem('inventory') || '[]');
      if (localStorageInventory.length === 0) {
        console.log('[Admin] Auto-syncing inventory...');
        const inventoryResponse = await fetch('/api/inventory');
        if (inventoryResponse.ok) {
          const inventoryData = await inventoryResponse.json();
          const inventoryItems = inventoryData || [];
          localStorage.setItem('inventory', JSON.stringify(inventoryItems));
          console.log('[Admin] Auto-synced', inventoryItems.length, 'inventory items');
        }
      }
      
      console.log('[Admin] Auto-sync complete');
    } catch (error) {
      console.error('[Admin] Auto-sync error:', error);
    }
  };

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

        // Load event flags
        await loadEventFlags();

        // Run data comparison automatically
        await compareDataSources();
        
        // 🎯 NEW: Auto-sync missing data to localStorage
        await autoSyncMissingData();

      } catch (error) {
        console.error('Error loading Supabase data:', error);
        toast.error('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    }

    loadSupabaseData();
    
    // 🎯 NEW: Set up periodic auto-sync every 5 minutes
    const autoSyncInterval = setInterval(autoSyncMissingData, 5 * 60 * 1000);
    
    return () => {
      clearInterval(autoSyncInterval);
    };
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
        
        // Prepare the correct body for each endpoint
        let body = null;
        if (method === 'POST') {
          if (api.endpoint.includes('discover')) {
            body = JSON.stringify({ creatureId: 'test-creature' });
          } else if (api.endpoint.includes('increment')) {
            body = JSON.stringify({ action: 'test-action' });
          } else {
            body = JSON.stringify({ test: true });
          }
        }
        
        const headers: Record<string, string> = method === 'POST' ? { 'Content-Type': 'application/json' } : {};
        
        // Add authorization header if user is authenticated
        if (user?.id) {
          try {
            const token = await getToken();
            if (token) {
              headers['Authorization'] = `Bearer ${token}`;
            }
          } catch (tokenError) {
            // Removed debugging log
          }
        }

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

  // New function to compare data between localStorage and Supabase
  const compareDataSources = async () => {
    if (!user?.id) return;
    
    setIsComparingData(true);
    const now = new Date().toISOString();
    const comparisons: DataComparison[] = [];

    try {
      // 1. Compare Quest Completions - BYPASS BROKEN QUEST API
      try {
        const localStorageQuests = JSON.parse(localStorage.getItem('questCompletions') || '[]');
        const localStorageQuestCount = localStorageQuests.length; // Direct count since we store completed quests
        
        // BYPASS: Use the working simple quest API directly instead of the broken main Quest API
        console.log('[Admin] Bypassing broken Quest API, using simple API directly...');
        
        const simpleResponse = await fetch('/api/quests/simple', {
          credentials: 'include'
        });
        
        if (simpleResponse.ok) {
          const simpleData = await simpleResponse.json();
          console.log('[Admin] Simple quest API data:', simpleData);
          
          // Use the accurate counts from the working simple API
          const supabaseQuestCount = simpleData.completedQuests || 0;
          const actualCompletedCount = simpleData.completedQuests || 0;
          const actualIncompleteCount = simpleData.incompleteQuests || 0;
          
          console.log('[Admin] Quest counts from working simple API:', { 
            completed: actualCompletedCount, 
            incomplete: actualIncompleteCount,
            total: simpleData.challengesCount || 0
          });
          
          const questComparison: DataComparison = {
            table: 'Quest Completions',
            localStorageCount: localStorageQuestCount,
            supabaseCount: supabaseQuestCount,
            difference: supabaseQuestCount - localStorageQuestCount,
            status: supabaseQuestCount === localStorageQuestCount ? 'synced' :
                    supabaseQuestCount > localStorageQuestCount ? 'supabase-ahead' : 'local-ahead',
            lastChecked: now
          };
          comparisons.push(questComparison);
        } else {
          console.error('[Admin] Simple quest API failed:', simpleResponse.status, simpleResponse.statusText);
          comparisons.push({
            table: 'Quest Completions',
            localStorageCount: localStorageQuestCount,
            supabaseCount: 0,
            difference: 0,
            status: 'error',
            lastChecked: now
          });
        }
      } catch (error) {
        console.error('[Admin] Quest comparison error:', error);
        comparisons.push({
          table: 'Quest Completions',
          localStorageCount: 0,
          supabaseCount: 0,
          difference: 0,
          status: 'error',
          lastChecked: now
        });
      }

      // 2. Compare Gold Transactions - FIXED API CALL
      try {
        const localStorageGold = JSON.parse(localStorage.getItem('goldTransactions') || '[]');
        const localStorageGoldCount = localStorageGold.length;
        
        // FIXED: Use correct gold API endpoint
        const goldResponse = await fetch('/api/gold-transactions', {
          credentials: 'include'
        });
        
        if (goldResponse.ok) {
          const goldData = await goldResponse.json();
          console.log('[Admin] Gold API Response:', goldData);
          
          // Handle both array and object responses
          const goldTransactions = Array.isArray(goldData) ? goldData : (goldData.data || []);
          const supabaseGoldCount = goldTransactions.length;
          
          console.log('[Admin] Gold Transactions Count:', supabaseGoldCount);
          
          const goldComparison: DataComparison = {
            table: 'Gold Transactions',
            localStorageCount: localStorageGoldCount,
            supabaseCount: supabaseGoldCount,
            difference: supabaseGoldCount - localStorageGoldCount,
            status: supabaseGoldCount === localStorageGoldCount ? 'synced' :
                    supabaseGoldCount > localStorageGoldCount ? 'supabase-ahead' : 'local-ahead',
            lastChecked: now
          };
          comparisons.push(goldComparison);
        } else {
          console.error('[Admin] Gold API failed:', goldResponse.status, goldResponse.statusText);
          comparisons.push({
            table: 'Gold Transactions',
            localStorageCount: localStorageGoldCount,
            supabaseCount: 0,
            difference: 0,
            status: 'error',
            lastChecked: now
          });
        }
      } catch (error) {
        console.error('[Admin] Gold comparison error:', error);
        comparisons.push({
          table: 'Gold Transactions',
          localStorageCount: 0,
          supabaseCount: 0,
          difference: 0,
          status: 'error',
          lastChecked: now
        });
      }

      // 3. Compare Experience Transactions - FIXED API CALL
      try {
        const localStorageExp = JSON.parse(localStorage.getItem('experienceTransactions') || '[]');
        const localStorageExpCount = localStorageExp.length;
        
        // FIXED: Use correct experience API endpoint
        const expResponse = await fetch('/api/experience-transactions', {
          credentials: 'include'
        });
        
        if (expResponse.ok) {
          const expData = await expResponse.json();
          console.log('[Admin] Experience API Response:', expData);
          
          // Handle both array and object responses
          const expTransactions = Array.isArray(expData) ? expData : (expData.data || []);
          const supabaseExpCount = expTransactions.length;
          
          console.log('[Admin] Experience Transactions Count:', supabaseExpCount);
          
          const expComparison: DataComparison = {
            table: 'Experience Transactions',
            localStorageCount: localStorageExpCount,
            supabaseCount: supabaseExpCount,
            difference: supabaseExpCount - localStorageExpCount,
            status: supabaseExpCount === localStorageExpCount ? 'synced' :
                    supabaseExpCount > localStorageExpCount ? 'supabase-ahead' : 'local-ahead',
            lastChecked: now
          };
          comparisons.push(expComparison);
        } else {
          console.error('[Admin] Experience API failed:', expResponse.status, expResponse.statusText);
          comparisons.push({
            table: 'Experience Transactions',
            localStorageCount: localStorageExpCount,
            supabaseCount: 0,
            difference: 0,
            status: 'error',
            lastChecked: now
          });
        }
      } catch (error) {
        console.error('[Admin] Experience comparison error:', error);
        comparisons.push({
          table: 'Experience Transactions',
          localStorageCount: 0,
          supabaseCount: 0,
          difference: 0,
          status: 'error',
          lastChecked: now
        });
      }

      // 4. Compare Inventory Items - FIXED API CALL
      try {
        const localStorageInventory = JSON.parse(localStorage.getItem('inventory') || '[]');
        const localStorageInventoryCount = localStorageInventory.length;
        
        // FIXED: Use correct inventory API endpoint
        const inventoryResponse = await fetch('/api/inventory', {
          credentials: 'include'
        });
        
        if (inventoryResponse.ok) {
          const inventoryData = await inventoryResponse.json();
          console.log('[Admin] Inventory API Response:', inventoryData);
          
          // Handle both array and object responses
          const inventoryItems = Array.isArray(inventoryData) ? inventoryData : (inventoryData.data || []);
          const supabaseInventoryCount = inventoryItems.length;
          
          console.log('[Admin] Inventory Items Count:', supabaseInventoryCount);
          
          const inventoryComparison: DataComparison = {
            table: 'Inventory Items',
            localStorageCount: localStorageInventoryCount,
            supabaseCount: supabaseInventoryCount,
            difference: supabaseInventoryCount - localStorageInventoryCount,
            status: supabaseInventoryCount === localStorageInventoryCount ? 'synced' :
                    supabaseInventoryCount > localStorageInventoryCount ? 'supabase-ahead' : 'local-ahead',
            lastChecked: now
          };
          comparisons.push(inventoryComparison);
        } else {
          console.error('[Admin] Inventory API failed:', inventoryResponse.status, inventoryResponse.statusText);
          comparisons.push({
            table: 'Inventory Items',
            localStorageCount: localStorageInventoryCount,
            supabaseCount: 0,
            difference: 0,
            status: 'error',
            lastChecked: now
          });
        }
      } catch (error) {
        console.error('[Admin] Inventory comparison error:', error);
        comparisons.push({
          table: 'Inventory Items',
          localStorageCount: 0,
          supabaseCount: 0,
          difference: 0,
          status: 'error',
          lastChecked: now
        });
      }

      // 5. Compare Challenge Completions
      try {
        const localStorageChallenges = JSON.parse(localStorage.getItem('challenges') || '[]');
        const localStorageChallengeCount = localStorageChallenges.filter((c: any) => c.completed).length;
        
        // Use API endpoint instead of direct Supabase call
        const challengeResponse = await fetch('/api/challenges', {
          credentials: 'include'
        });
        const challengeData = challengeResponse.ok ? await challengeResponse.json() : [];
        // Count challenges that are marked as completed
        const supabaseChallengeCount = challengeData.filter((c: any) => c.completed).length;
        
        const challengeComparison: DataComparison = {
          table: 'Challenge Completions',
          localStorageCount: localStorageChallengeCount,
          supabaseCount: supabaseChallengeCount,
          difference: supabaseChallengeCount - localStorageChallengeCount,
          status: supabaseChallengeCount === localStorageChallengeCount ? 'synced' :
                  supabaseChallengeCount > localStorageChallengeCount ? 'supabase-ahead' : 'local-ahead',
          lastChecked: now
        };
        comparisons.push(challengeComparison);
      } catch (error) {
        comparisons.push({
          table: 'Challenge Completions',
          localStorageCount: 0,
          supabaseCount: 0,
          difference: 0,
          status: 'error',
          lastChecked: now
        });
      }

      // 6. Compare Milestone Completions
      try {
        const localStorageMilestones = JSON.parse(localStorage.getItem('milestones') || '[]');
        const localStorageMilestoneCount = localStorageMilestones.filter((m: any) => m.completed).length;
        
        // Use API endpoint instead of direct Supabase call
        const milestoneResponse = await fetch('/api/milestones', {
          credentials: 'include'
        });
        const milestoneData = milestoneResponse.ok ? await milestoneResponse.json() : [];
        // Count milestones that are marked as completed
        const supabaseMilestoneCount = milestoneData.filter((m: any) => m.completed).length;
        
        const milestoneComparison: DataComparison = {
          table: 'Milestone Completions',
          localStorageCount: localStorageMilestoneCount,
          supabaseCount: supabaseMilestoneCount,
          difference: supabaseMilestoneCount - localStorageMilestoneCount,
          status: supabaseMilestoneCount === localStorageMilestoneCount ? 'synced' :
                  supabaseMilestoneCount > localStorageMilestoneCount ? 'supabase-ahead' : 'local-ahead',
          lastChecked: now
        };
        comparisons.push(milestoneComparison);
      } catch (error) {
        comparisons.push({
          table: 'Milestone Completions',
          localStorageCount: 0,
          supabaseCount: 0,
          difference: 0,
          status: 'error',
          lastChecked: now
        });
      }

      // 7. Compare Kingdom Events
      try {
        const localStorageKingdomEvents = JSON.parse(localStorage.getItem('kingdom-events') || '[]');
        const localStorageKingdomEventCount = localStorageKingdomEvents.length;
        
        // Try to fetch kingdom events from API
        let supabaseKingdomEventCount = 0;
        try {
          const kingdomEventResponse = await fetch('/api/kingdom-events', {
            credentials: 'include'
          });
          if (kingdomEventResponse.ok) {
            const kingdomEventData = await kingdomEventResponse.json();
            supabaseKingdomEventCount = Array.isArray(kingdomEventData) ? kingdomEventData.length : 0;
          }
        } catch (kingdomEventError) {
          console.log('Kingdom Events API not available, skipping count');
        }
        
        const kingdomEventComparison: DataComparison = {
          table: 'Kingdom Events',
          localStorageCount: localStorageKingdomEventCount,
          supabaseCount: supabaseKingdomEventCount,
          difference: supabaseKingdomEventCount - localStorageKingdomEventCount,
          status: supabaseKingdomEventCount === localStorageKingdomEventCount ? 'synced' :
                  supabaseKingdomEventCount > localStorageKingdomEventCount ? 'supabase-ahead' : 'local-ahead',
          lastChecked: now
        };
        comparisons.push(kingdomEventComparison);
      } catch (error) {
        comparisons.push({
          table: 'Kingdom Events',
          localStorageCount: 0,
          supabaseCount: 0,
          difference: 0,
          status: 'error',
          lastChecked: now
        });
      }

      // 8. Compare Character Stats
      try {
        const localStorageCharacterStats = JSON.parse(localStorage.getItem('character-stats') || '[]');
        const localStorageCharacterStatCount = Array.isArray(localStorageCharacterStats) ? localStorageCharacterStats.length : 0;
        
        // Try to fetch character stats from API
        let supabaseCharacterStatCount = 0;
        try {
          const characterStatResponse = await fetch('/api/character-stats', {
            credentials: 'include'
          });
          if (characterStatResponse.ok) {
            const characterStatData = await characterStatResponse.json();
            supabaseCharacterStatCount = Array.isArray(characterStatData) ? characterStatData.length : 0;
          }
        } catch (characterStatError) {
          console.log('Character Stats API not available, skipping count');
        }
        
        // Ensure we have valid numbers for comparison
        const localCount = Number.isNaN(localStorageCharacterStatCount) ? 0 : localStorageCharacterStatCount;
        const supabaseCount = Number.isNaN(supabaseCharacterStatCount) ? 0 : supabaseCharacterStatCount;
        const difference = supabaseCount - localCount;
        
        const characterStatComparison: DataComparison = {
          table: 'Character Stats',
          localStorageCount: localCount,
          supabaseCount: supabaseCount,
          difference: difference,
          status: supabaseCount === localCount ? 'synced' :
                  supabaseCount > localCount ? 'supabase-ahead' : 'local-ahead',
          lastChecked: now
        };
        comparisons.push(characterStatComparison);
      } catch (error) {
        console.error('Character Stats comparison error:', error);
        comparisons.push({
          table: 'Character Stats',
          localStorageCount: 0,
          supabaseCount: 0,
          difference: 0,
          status: 'error',
          lastChecked: now
        });
      }

      // 9. Compare Achievements
      try {
        const localStorageAchievements = JSON.parse(localStorage.getItem('achievements') || '[]');
        const localStorageAchievementCount = localStorageAchievements.filter((a: any) => a.unlocked).length;
        
        // Try to fetch achievements from API
        let supabaseAchievementCount = 0;
        try {
          const achievementResponse = await fetch('/api/achievements', {
            credentials: 'include'
          });
          if (achievementResponse.ok) {
            const achievementData = await achievementResponse.json();
            supabaseAchievementCount = Array.isArray(achievementData) ? achievementData.filter((a: any) => a.unlocked).length : 0;
          }
        } catch (achievementError) {
          console.log('Achievements API not available, skipping count');
        }
        
        const achievementComparison: DataComparison = {
          table: 'Achievements',
          localStorageCount: localStorageAchievementCount,
          supabaseCount: supabaseAchievementCount,
          difference: supabaseAchievementCount - localStorageAchievementCount,
          status: supabaseAchievementCount === localStorageAchievementCount ? 'synced' :
                  supabaseAchievementCount > localStorageAchievementCount ? 'supabase-ahead' : 'local-ahead',
          lastChecked: now
        };
        comparisons.push(achievementComparison);
      } catch (error) {
        comparisons.push({
          table: 'Achievements',
          localStorageCount: 0,
          supabaseCount: 0,
          difference: 0,
          status: 'error',
          lastChecked: now
        });
      }

      setDataComparison(comparisons);
      toast.success('Data comparison completed!');
    } catch (error) {
      console.error('Error comparing data:', error);
      toast.error('Failed to compare data sources');
    } finally {
      setIsComparingData(false);
    }
  };

  // Debug function to check quest completions directly
  const handleDebugQuestCompletions = async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch('/api/quests?debug=1', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const debugData = await response.json();
        console.log('Quest Debug Data:', debugData);
        
        // Show the results in a toast
        if (debugData.debug) {
          const message = `Quest Debug: ${debugData.count} completions found. User ID: ${debugData.userId}`;
          toast.info(message);
          
          // Also log the completions if any exist
          if (debugData.completions && debugData.completions.length > 0) {
            console.log('Quest Completions Found:', debugData.completions);
            toast.success(`Found ${debugData.completions.length} quest completions!`);
          } else {
            toast.warning('No quest completions found in database');
          }
        }
      } else {
        toast.error('Failed to fetch quest debug data');
      }
    } catch (error) {
      console.error('Quest debug error:', error);
      toast.error('Error debugging quest completions');
    }
  };

  // Test function to check quest matching logic
  const handleTestQuestMatching = async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch('/api/quests/test', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const testData = await response.json();
        console.log('Quest Matching Test:', testData);
        
        // Show results in toast
        const completedCount = testData.analysis?.filter((a: any) => a.is_completed).length || 0;
        const totalCount = testData.completions_count || 0;
        
        toast.info(`Quest Test: ${completedCount}/${totalCount} completions are actually completed`);
        
        // Log detailed analysis
        if (testData.analysis) {
          console.log('Quest Matching Analysis:', testData.analysis);
        }
      } else {
        toast.error('Failed to test quest matching');
      }
    } catch (error) {
      console.error('Quest matching test error:', error);
      toast.error('Error testing quest matching');
    }
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

  const generateSummary = () => {
    const now = new Date().toLocaleString();
    const workingSystems = connectionStatuses.filter(c => c.status === 'connected');
    const brokenSystems = connectionStatuses.filter(c => c.status === 'error');
    const criticalIssues = brokenSystems.filter(c => c.priority === 'critical');
    const highPriorityIssues = brokenSystems.filter(c => c.priority === 'high');
    const mediumPriorityIssues = brokenSystems.filter(c => c.priority === 'medium');
    const lowPriorityIssues = brokenSystems.filter(c => c.priority === 'low');

    const summary = `
BUILD STATUS SUMMARY - ${now}
=====================================

OVERALL STATUS:
• Health: ${buildStatus.overall.toUpperCase()}
• Working Systems: ${buildStatus.workingSystems}/${buildStatus.totalSystems} (${buildStatus.progress.toFixed(1)}%)
• Broken Systems: ${buildStatus.brokenSystems}

BROKEN SYSTEMS (${brokenSystems.length}):
${brokenSystems.map(issue => `• ${issue.name}: ${issue.error || 'Unknown error'} (${issue.endpoint})`).join('\n')}

CRITICAL ISSUES (${criticalIssues.length}):
${criticalIssues.map(issue => `• ${issue.name}: ${issue.error || 'Unknown error'} (${issue.endpoint})`).join('\n')}

HIGH PRIORITY ISSUES (${highPriorityIssues.length}):
${highPriorityIssues.map(issue => `• ${issue.name}: ${issue.error || 'Unknown error'} (${issue.endpoint})`).join('\n')}

MEDIUM PRIORITY ISSUES (${mediumPriorityIssues.length}):
${mediumPriorityIssues.map(issue => `• ${issue.name}: ${issue.error || 'Unknown error'} (${issue.endpoint})`).join('\n')}

LOW PRIORITY ISSUES (${lowPriorityIssues.length}):
${lowPriorityIssues.map(issue => `• ${issue.name}: ${issue.error || 'Unknown error'} (${issue.endpoint})`).join('\n')}

WORKING SYSTEMS (${workingSystems.length}):
${workingSystems.map(system => `• ${system.name} (${system.category})`).join('\n')}

PROGRESS BY CATEGORY:
• Core Systems: ${buildStatus.coreSystems}/3 (${((buildStatus.coreSystems / 3) * 100).toFixed(1)}%)
• Gameplay Features: ${buildStatus.gameplayFeatures}/8 (${((buildStatus.gameplayFeatures / 8) * 100).toFixed(1)}%)
• Social Features: ${buildStatus.socialFeatures}/3 (${((buildStatus.socialFeatures / 3) * 100).toFixed(1)}%)
• Admin Features: ${buildStatus.adminFeatures}/15 (${((buildStatus.adminFeatures / 15) * 100).toFixed(1)}%)

NEXT STEPS:
${criticalIssues.length > 0 ? `1. Fix ${criticalIssues.length} critical issue(s) first` : '1. No critical issues - good!'}
${highPriorityIssues.length > 0 ? `2. Address ${highPriorityIssues.length} high priority issue(s)` : '2. No high priority issues'}
${mediumPriorityIssues.length > 0 ? `3. Review ${mediumPriorityIssues.length} medium priority issue(s)` : '3. No medium priority issues'}
${lowPriorityIssues.length > 0 ? `4. Consider ${lowPriorityIssues.length} low priority issue(s)` : '4. No low priority issues'}

TECHNICAL DETAILS:
• Total APIs Tested: ${connectionStatuses.length}
• Last Checked: ${now}
• User ID: ${user?.id || 'Unknown'}
• Environment: ${process.env.NODE_ENV || 'development'}
`;

    // Copy to clipboard
    navigator.clipboard.writeText(summary).then(() => {
      toast.success('Summary copied to clipboard!');
    }).catch(() => {
      // Fallback: show in alert
      alert(summary);
    });

    return summary;
  };

  // Initialize default event flags if they don't exist
  const initializeDefaultFlags = async () => {
    try {
      // Check if winter festival setting exists
      const winterResponse = await fetchWithAuth('/api/game-settings?key=winter_festival_active');
      if (winterResponse.ok) {
        const winterData = await winterResponse.json();
        if (!winterData?.data?.data?.[0]?.setting_value) {
          await fetchWithAuth('/api/game-settings', {
            method: 'POST',
            body: JSON.stringify({
              setting_key: 'winter_festival_active',
              setting_value: 'false',
            }),
          });
          // Small delay to ensure database transaction completes
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Check if harvest festival setting exists
      const harvestResponse = await fetchWithAuth('/api/game-settings?key=harvest_festival_active');
      if (harvestResponse.ok) {
        const harvestData = await harvestResponse.json();
        if (!harvestData?.data?.data?.[0]?.setting_value) {
          await fetchWithAuth('/api/game-settings', {
            method: 'POST',
            body: JSON.stringify({
              setting_key: 'harvest_festival_active',
              setting_value: 'false',
            }),
          });
          // Small delay to ensure database transaction completes
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    } catch (error) {
              console.error('[Admin] Error initializing default flags:', error);
    }
  };

  // Load event flags from database
  const loadEventFlags = async () => {
    try {
      // First initialize default values if they don't exist
      await initializeDefaultFlags();
      
      // Small delay to ensure database is ready
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Load winter festival status
      const winterResponse = await fetchWithAuth('/api/game-settings?key=winter_festival_active');
              if (winterResponse.ok) {
          const winterData = await winterResponse.json();
          const winterValue = winterData?.data?.data?.[0]?.setting_value;
          // Handle both undefined and actual values
          const winterActive = winterValue !== undefined ? String(winterValue).toLowerCase() === 'true' : false;
          setWinterFestivalActive(winterActive);
        }

      // Load harvest festival status (for future use)
      const harvestResponse = await fetchWithAuth('/api/game-settings?key=harvest_festival_active');
              if (harvestResponse.ok) {
          const harvestData = await harvestResponse.json();
          const harvestValue = harvestData?.data?.data?.[0]?.setting_value;
          // Handle both undefined and actual values
          const harvestActive = harvestValue !== undefined ? String(harvestValue).toLowerCase() === 'true' : false;
          setHarvestFestivalActive(harvestActive);
        }
    } catch (error) {
              console.error('[Admin] Error loading event flags:', error);
    }
  };

  // Load event flags on component mount
  useEffect(() => {
    loadEventFlags();
  }, []);

  // Refresh event flags from database
  const refreshEventFlags = async () => {
    try {
      // Load winter festival status
      const winterResponse = await fetchWithAuth('/api/game-settings?key=winter_festival_active');
      if (winterResponse.ok) {
        const winterData = await winterResponse.json();
        const winterValue = winterData?.data?.data?.[0]?.setting_value;
        const winterActive = winterValue !== undefined ? String(winterValue).toLowerCase() === 'true' : false;
        setWinterFestivalActive(winterActive);
      }

      // Load harvest festival status
      const harvestResponse = await fetchWithAuth('/api/game-settings?key=harvest_festival_active');
      if (harvestResponse.ok) {
        const harvestData = await harvestResponse.json();
        const harvestValue = harvestData?.data?.data?.[0]?.setting_value;
        const harvestActive = harvestValue !== undefined ? String(harvestValue).toLowerCase() === 'true' : false;
        setHarvestFestivalActive(harvestActive);
        console.log(`[Admin] Refreshed harvest festival active: ${harvestActive}`);
      }
    } catch (error) {
              console.error('[Admin] Error refreshing event flags:', error);
    }
  };

  // Toggle event status
  const toggleEvent = async (key: string, currentValue: boolean) => {
    const newValue = !currentValue;
    
            console.log(`[Admin] Toggling ${key} from ${currentValue} to ${newValue}`);
    
    try {
      const response = await fetchWithAuth('/api/game-settings', {
        method: 'POST',
        body: JSON.stringify({
          setting_key: key,
          setting_value: newValue.toString(),
        }),
      });

      if (response.ok) {
        // Small delay to ensure database is updated
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Refresh the event flags to get the latest values
        await refreshEventFlags();
        
        if (key === 'winter_festival_active') {
          // Dispatch event to notify kingdom grid component
          window.dispatchEvent(new CustomEvent('winter-festival-toggled', { detail: { active: newValue } }));
        } else if (key === 'harvest_festival_active') {
          // Dispatch event to notify kingdom grid component
          window.dispatchEvent(new CustomEvent('harvest-festival-toggled', { detail: { active: newValue } }));
        }
        
        toast.success(`${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} is now ${newValue ? 'ACTIVE' : 'INACTIVE'}`);
      } else {
        const errorText = await response.text();
        console.error(`[Admin] API error: ${response.status} - ${errorText}`);
        toast.error('Failed to update event status');
      }
    } catch (error) {
              console.error('[Admin] Error updating event:', error);
      toast.error('An error occurred while updating the event');
    }
  };

  return (
    <main className="container mx-auto p-4 space-y-6" aria-label="build-status-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Build Status Dashboard</h1>
                          <p className="text-muted-foreground">Monitor your application health and progress</p>
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
          <Button onClick={generateSummary} variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700">
            Summary
          </Button>
        </div>
      </div>

      {/* Event Toggles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            Seasonal Events
          </CardTitle>
          <CardDescription>Toggle seasonal events on/off. When off, seasonal tiles only appear naturally.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <div>
                  <div className="font-medium">Winter Festival</div>
                  <div className="text-sm text-muted-foreground">
                    Activates +20% gold and +10% EXP bonuses on winter tiles (Winter Fountain, Snowy Inn, Ice Sculpture, Fireworks Stand)
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                                  <Badge variant={winterFestivalActive ? 'default' : 'secondary'}>
                    {winterFestivalActive ? 'ACTIVE' : 'INACTIVE'}
                  </Badge>
                <Button 
                  onClick={() => toggleEvent('winter_festival_active', winterFestivalActive)}
                  disabled={isUpdatingEvents}
                  variant={winterFestivalActive ? 'destructive' : 'default'}
                  size='sm'
                >
                  {winterFestivalActive ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <div>
                  <div className="font-medium">Harvest Festival</div>
                  <div className="text-sm text-muted-foreground">
                    Future event for harvest-themed tiles (Harvest Barn, Pumpkin Patch, Bakery, Brewery)
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={harvestFestivalActive ? 'default' : 'secondary'}>
                  {harvestFestivalActive ? 'ACTIVE' : 'INACTIVE'}
                </Badge>
                <Button 
                  onClick={() => toggleEvent('harvest_festival_active', harvestFestivalActive)}
                  disabled={isUpdatingEvents}
                  variant={harvestFestivalActive ? 'destructive' : 'default'}
                  size='sm'
                >
                  {harvestFestivalActive ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-800">
                <strong>How it works:</strong>
                <ul className="mt-2 ml-4 space-y-1">
                  <li>• <strong>When ACTIVE:</strong> Seasonal tiles are fully available for purchase and placement, with bonus rewards</li>
                  <li>• <strong>When INACTIVE:</strong> Seasonal tiles only appear naturally through rare drops or special events</li>
                  <li>• <strong>Winter tiles:</strong> Winter Fountain, Snowy Inn, Ice Sculpture, Fireworks Stand</li>
                  <li>• <strong>Harvest tiles:</strong> Harvest Barn, Pumpkin Patch, Bakery, Brewery</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Comparison Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Data Source Comparison
          </CardTitle>
          <CardDescription>
            Compare data counts between localStorage and Supabase to identify synchronization issues
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                This helps identify why kingdom stats might be missing data points
              </p>
              <div className="flex gap-2">
                <Button 
                  onClick={compareDataSources} 
                  disabled={isComparingData}
                  variant="outline"
                  size="sm"
                >
                  {isComparingData ? "Comparing..." : "Compare Data Sources"}
                </Button>
                <Button 
                  onClick={syncDataToLocalStorage} 
                  disabled={isLoading}
                  variant="default"
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isLoading ? "Syncing..." : "🔄 Sync to localStorage"}
                </Button>
                <Button 
                  onClick={handleDebugQuestCompletions} 
                  variant="outline"
                  size="sm"
                >
                  Debug Quests
                </Button>
                <Button 
                  onClick={handleTestQuestMatching} 
                  variant="outline"
                  size="sm"
                >
                  Test Matching
                </Button>
                        <Button 
          onClick={async () => {
            try {
              console.log('=== TESTING WORKING SIMPLE QUEST API ===');
              const response = await fetch('/api/quests/simple', {
                credentials: 'include'
              });
              if (response.ok) {
                const data = await response.json();
                console.log('✅ Simple Quest API Response:', data);
                console.log('✅ Completed Quests:', data.completedQuests);
                console.log('✅ Incomplete Quests:', data.incompleteQuests);
                console.log('✅ Total Completions:', data.completionsCount);
                console.log('✅ Total Challenges:', data.challengesCount);
              } else {
                console.error('❌ Simple Quest API failed:', response.status, response.statusText);
              }
            } catch (error) {
              console.error('❌ Simple Quest API error:', error);
            }
          }}
          variant="outline"
          size="sm"
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          Test Working Simple Quest API
        </Button>
              </div>
            </div>
            
            {dataComparison.length > 0 && (
              <div className="space-y-3">
                {dataComparison.map((comparison, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{comparison.table}</h4>
                      <Badge 
                        variant={
                          comparison.status === 'synced' ? 'default' :
                          comparison.status === 'local-ahead' ? 'secondary' :
                          comparison.status === 'supabase-ahead' ? 'destructive' :
                          'outline'
                        }
                        className={
                          comparison.status === 'synced' ? 'bg-green-100 text-green-800 border-green-200' :
                          comparison.status === 'local-ahead' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                          comparison.status === 'supabase-ahead' ? 'bg-red-100 text-red-800 border-red-200' :
                          'bg-gray-100 text-gray-800 border-gray-200'
                        }
                      >
                        {comparison.status === 'synced' ? '✅ Synced' :
                         comparison.status === 'local-ahead' ? '⚠️ Local Ahead' :
                         comparison.status === 'supabase-ahead' ? '❌ Supabase Ahead' :
                         '❓ Error'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">localStorage</div>
                        <div className="font-semibold text-lg">{comparison.localStorageCount}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Supabase</div>
                        <div className="font-semibold text-lg">{comparison.supabaseCount}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Difference</div>
                        <div className={`font-semibold text-lg ${
                          comparison.difference === 0 ? 'text-green-600' :
                          comparison.difference > 0 ? 'text-red-600' :
                          'text-yellow-600'
                        }`}>
                          {comparison.difference > 0 ? '+' : ''}{comparison.difference}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 text-xs text-muted-foreground">
                      Last checked: {new Date(comparison.lastChecked).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {dataComparison.length === 0 && !isComparingData && (
              <div className="text-center py-8 text-muted-foreground">
                <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Click Compare Data Sources to analyze data synchronization</p>
              </div>
            )}
            
            {isComparingData && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                <p className="text-muted-foreground">Comparing data sources...</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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

      {/* Summary Action Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            📋 Generate Summary Report
          </CardTitle>
          <CardDescription className="text-blue-600">
            Create a comprehensive report of all issues for easy sharing and debugging
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-blue-700">
              Click the button below to generate a detailed summary that includes:
            </p>
            <ul className="text-sm text-blue-700 space-y-1 ml-4">
              <li>• Critical, high, medium, and low priority issues</li>
              <li>• Working systems and progress percentages</li>
              <li>• Specific error messages and endpoints</li>
              <li>• Actionable next steps</li>
              <li>• Technical details for debugging</li>
            </ul>
            <Button 
              onClick={generateSummary} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              📋 Generate & Copy Summary Report
            </Button>
          </div>
        </CardContent>
      </Card>

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
            
            <Separator />
            
            <div>
              <h4 className="font-medium mb-2">Rare Tiles Tests</h4>
              <div className="flex flex-wrap gap-2">
                {RARE_TILES.map((tile) => (
                  <div key={tile.id} className="flex gap-2">
                    <Button 
                      onClick={() => handleUnlockRareTile(tile.id)} 
                      variant="outline" 
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Unlock {tile.name}
                    </Button>
                    <Button 
                      onClick={() => handleClearRareTile(tile.id)} 
                      variant="outline" 
                      size="sm"
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      Clear {tile.name}
                    </Button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Test buttons for rare tile unlock functionality
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
} 