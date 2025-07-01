"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { storageService } from '@/lib/storage-service';
import { toast } from 'sonner';
import { formatBytes } from '@/lib/utils';
import { MigrationStatus } from '@/components/migration-status'
import { HealthCheck } from '@/components/health-check'
import { useSupabase } from '@/lib/hooks/useSupabase';
import { useAuth } from '@clerk/nextjs';

interface StoredData {
  key: string;
  value: any;
  size: number;
  lastUpdated: string;
  version: string;
}

// Utility to get a value from localStorage or return null
function getStoredValue<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export default function StoredDataPage() {
  const [storedData, setStoredData] = useState<StoredData[]>([]);
  const [storageInfo, setStorageInfo] = useState<{ total: number; used: number; remaining: number }>({ total: 0, used: 0, remaining: 0 });
  const [storageStats, setStorageStats] = useState<{ 
    totalItems: number; 
    totalSize: number; 
    averageItemSize: number; 
    oldestItem: string | null; 
    newestItem: string | null; 
  }>({
    totalItems: 0,
    totalSize: 0,
    averageItemSize: 0,
    oldestItem: null,
    newestItem: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'key' | 'size' | 'lastUpdated'>('key');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // --- Key data types ---
  const quests = getStoredValue<any>('quests'); // TODO: Replace with Supabase fetch
  const gold = getStoredValue<number>('gold-balance'); // TODO: Replace with Supabase fetch
  const exp = getStoredValue<number>('experience'); // TODO: Replace with Supabase fetch
  const achievements = getStoredValue<any>('achievements'); // TODO: Replace with Supabase fetch
  const grid = getStoredValue<any>('grid'); // TODO: Replace with Supabase fetch
  const titles = getStoredValue<any>('titles'); // TODO: Replace with Supabase fetch
  const perks = getStoredValue<any>('perks'); // TODO: Replace with Supabase fetch
  const strengths = getStoredValue<any>('strengths'); // TODO: Replace with Supabase fetch
  const characterPosition = getStoredValue<any>('character-position'); // TODO: Replace with Supabase fetch

  // --- Supabase entities (TODO: fetch from Supabase) ---
  // TODO: Fetch these from Supabase and display summary
  // - Account
  // - Item
  // - QuestCompletion
  // - Session
  // - TilePlacement
  // - User
  // - VerificationToken

  const { userId } = useAuth();
  const { supabase, isLoading: isSupabaseLoading } = useSupabase();
  const [challengeDefs, setChallengeDefs] = useState<any[]>([]);
  const [userChallenges, setUserChallenges] = useState<any[]>([]);
  const [achievementDefs, setAchievementDefs] = useState<any[]>([]);
  const [userAchievements, setUserAchievements] = useState<any[]>([]);
  const [isChallengeLoading, setIsChallengeLoading] = useState(false);
  const [isAchievementLoading, setIsAchievementLoading] = useState(false);

  // Fetch challenge and achievement data from Supabase
  useEffect(() => {
    if (!userId || !supabase) return;
    setIsChallengeLoading(true);
    setIsAchievementLoading(true);
    // Fetch challenge definitions
    supabase.from('Challenge').select('*').then(({ data }) => {
      setChallengeDefs(data || []);
      setIsChallengeLoading(false);
    });
    // Fetch user challenge progress
    supabase.from('UserChallenge').select('*').eq('userId', userId).then(({ data }) => {
      setUserChallenges(data || []);
    });
    // Fetch achievement definitions
    supabase.from('AchievementDefinition').select('*').then(({ data }) => {
      setAchievementDefs(data || []);
      setIsAchievementLoading(false);
    });
    // Fetch user achievement progress
    supabase.from('Achievement').select('*').eq('userId', userId).then(({ data }) => {
      setUserAchievements(data || []);
    });
  }, [userId, supabase]);

  const refreshData = () => {
    setIsLoading(true);
    try {
      const keys = storageService.getAllKeys();
      const data = keys.map(key => {
        const item = storageService.get<any>(key, null);
        if (item && typeof item === 'object' && 'value' in item) {
          return {
            key,
            value: item.value,
            size: JSON.stringify(item).length,
            lastUpdated: item.lastUpdated || 'Unknown',
            version: item.version || 'Unknown'
          };
        }
        return {
          key,
          value: item,
          size: JSON.stringify(item).length,
          lastUpdated: 'Unknown',
          version: 'Unknown'
        };
      });
      setStoredData(data);
      setStorageInfo(storageService.getStorageInfo());
      setStorageStats(storageService.getStats());
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Failed to refresh data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear all stored data? This cannot be undone.')) {
      try {
        // Clear all storage
        storageService.clear();
        window.localStorage.clear();
        window.sessionStorage.clear();
        // Dispatch a global event for all tabs/components
        window.dispatchEvent(new Event('app-reset'));
        // Show toast and reload after a short delay
        toast.success('All stored data cleared. Reloading...');
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } catch (error) {
        console.error('Error clearing data:', error);
        toast.error('Failed to clear data');
      }
    }
  };

  const handleBackup = () => {
    try {
      const backup = storageService.backup();
      const blob = new Blob([backup], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `storage-backup-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Backup created successfully');
    } catch (error) {
      console.error('Error creating backup:', error);
      toast.error('Failed to create backup');
    }
  };

  const handleRestore = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const backup = event.target?.result as string;
            if (storageService.restore(backup)) {
              refreshData();
              toast.success('Backup restored successfully');
            } else {
              toast.error('Failed to restore backup');
            }
          } catch (error) {
            console.error('Error restoring backup:', error);
            toast.error('Failed to restore backup');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const filteredAndSortedData = storedData
    .filter(item => 
      item.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(item.value).toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const multiplier = sortOrder === 'asc' ? 1 : -1;
      switch (sortBy) {
        case 'key':
          return multiplier * a.key.localeCompare(b.key);
        case 'size':
          return multiplier * (a.size - b.size);
        case 'lastUpdated':
          return multiplier * (new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime());
        default:
          return 0;
      }
    });

  useEffect(() => {
    refreshData();
  }, []);

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Stored Data</h1>
      </div>

      {/* System Status */}
      <div className="grid gap-6 md:grid-cols-2">
        <HealthCheck />
        <MigrationStatus />
      </div>

      {/* Existing stored data content */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Key Data Types */}
        <section aria-label="stored-data-summary-section">
          <Card aria-label="stored-data-summary-card">
            <CardHeader>
              <CardTitle>Stored Data Summary</CardTitle>
              <CardDescription>Key game data currently stored (localStorage or future Supabase)</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2" aria-label="stored-data-list">
                <li><strong>Quests:</strong> {quests ? (
                  <ul className="ml-4 list-disc">
                    {['might','knowledge','honor','castle','craft','vitality','wellness','exploration'].map(cat => (
                      <li key={cat}><strong>{cat.charAt(0).toUpperCase() + cat.slice(1)}:</strong> {Array.isArray(quests) ? quests.filter(q => q.category === cat).length : 0}</li>
                    ))}
                  </ul>
                ) : <em>None</em>} {/* TODO: Supabase integration */}</li>
                <li><strong>Gold:</strong> {gold ?? <em>None</em>} {/* TODO: Supabase integration */}</li>
                <li><strong>Experience:</strong> {exp ?? <em>None</em>} {/* TODO: Supabase integration */}</li>
                <li><strong>Achievements:</strong> {achievements ? JSON.stringify(achievements) : <em>None</em>} {/* TODO: Supabase integration */}</li>
                <li><strong>Grid:</strong> {grid ? '[Grid Data Present]' : <em>None</em>} {/* TODO: Supabase integration */}</li>
                <li><strong>Titles:</strong> {titles ? JSON.stringify(titles) : <em>None</em>} {/* TODO: Supabase integration */}</li>
                <li><strong>Perks:</strong> {perks ? JSON.stringify(perks) : <em>None</em>} {/* TODO: Supabase integration */}</li>
                <li><strong>Strengths:</strong> {strengths ? JSON.stringify(strengths) : <em>None</em>} {/* TODO: Supabase integration */}</li>
                <li><strong>Character Position:</strong> {characterPosition ? JSON.stringify(characterPosition) : <em>None</em>} {/* TODO: Supabase integration */}</li>
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* Supabase Entities */}
        <section aria-label="supabase-entities-section">
          <Card aria-label="supabase-entities-card">
            <CardHeader>
              <CardTitle>Supabase Entities</CardTitle>
              <CardDescription>These will be loaded from Supabase in the future</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2" aria-label="supabase-entities-list">
                <li><strong>Account</strong> {/* TODO: Supabase integration */}</li>
                <li><strong>Item</strong> {/* TODO: Supabase integration */}</li>
                <li><strong>QuestCompletion</strong> {/* TODO: Supabase integration */}</li>
                <li><strong>Session</strong> {/* TODO: Supabase integration */}</li>
                <li><strong>TilePlacement</strong> {/* TODO: Supabase integration */}</li>
                <li><strong>User</strong> {/* TODO: Supabase integration */}</li>
                <li><strong>VerificationToken</strong> {/* TODO: Supabase integration */}</li>
              </ul>
            </CardContent>
          </Card>
        </section>

        <section aria-label="user-challenge-achievement-section">
          <Card aria-label="user-challenge-achievement-card">
            <CardHeader>
              <CardTitle>User Challenges & Achievements</CardTitle>
              <CardDescription>Progress and unlocks synced with Supabase</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Challenges</h3>
                  {isChallengeLoading ? (
                    <div>Loading challenges...</div>
                  ) : (
                    <ul className="space-y-1" aria-label="challenge-list">
                      {challengeDefs.length === 0 ? (
                        <li>No challenges found.</li>
                      ) : challengeDefs.map((challenge) => {
                        const userChal = userChallenges.find((uc) => uc.challengeId === challenge.id);
                        return (
                          <li key={challenge.id} className="flex items-center gap-2">
                            <span className="font-mono text-sm">{challenge.name}</span>
                            <span className="text-xs text-gray-500">({challenge.category})</span>
                            <span className="ml-auto text-xs">
                              {userChal ? (
                                userChal.completed ? (
                                  <span className="text-green-600">Completed</span>
                                ) : (
                                  <span>Progress: {userChal.progress}</span>
                                )
                              ) : (
                                <span className="text-gray-400">Not started</span>
                              )}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Achievements</h3>
                  {isAchievementLoading ? (
                    <div>Loading achievements...</div>
                  ) : (
                    <ul className="space-y-1" aria-label="achievement-list">
                      {achievementDefs.length === 0 ? (
                        <li>No achievements found.</li>
                      ) : achievementDefs.map((ach) => {
                        const userAch = userAchievements.find((ua) => ua.achievementId === ach.id);
                        return (
                          <li key={ach.id} className="flex items-center gap-2">
                            <span className="font-mono text-sm">{ach.name}</span>
                            <span className="text-xs text-gray-500">({ach.category || 'uncategorized'})</span>
                            <span className="ml-auto text-xs">
                              {userAch ? (
                                userAch.unlocked ? (
                                  <span className="text-green-600">Unlocked</span>
                                ) : (
                                  <span>Progress: {userAch.progress}</span>
                                )
                              ) : (
                                <span className="text-gray-400">Not started</span>
                              )}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section aria-label="storage-info-section">
          <Card aria-label="storage-info-card">
            <CardHeader>
              <CardTitle>Storage Information</CardTitle>
              <CardDescription>Current storage usage and limits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Storage:</span>
                    <span>{formatBytes(storageInfo.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Used Storage:</span>
                    <span>{formatBytes(storageInfo.used)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Remaining Storage:</span>
                    <span>{formatBytes(storageInfo.remaining)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{ width: `${(storageInfo.used / storageInfo.total) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="text-lg font-semibold mb-2">Storage Statistics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Total Items</p>
                      <p className="text-lg font-medium">{storageStats.totalItems}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Size</p>
                      <p className="text-lg font-medium">{formatBytes(storageStats.totalSize)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Average Item Size</p>
                      <p className="text-lg font-medium">{formatBytes(storageStats.averageItemSize)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Storage Version</p>
                      <p className="text-lg font-medium">{storageService.get<string>('storage-version', '1.0.0')}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="text-lg font-semibold mb-2">Item Timeline</h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-gray-500">Oldest Item</p>
                      <p className="text-lg font-medium">{storageStats.oldestItem || 'None'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Newest Item</p>
                      <p className="text-lg font-medium">{storageStats.newestItem || 'None'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section aria-label="stored-data-section">
          <Card aria-label="stored-data-card">
            <CardHeader>
              <CardTitle>Stored Data</CardTitle>
              <CardDescription>All data currently stored in localStorage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button onClick={refreshData} disabled={isLoading} aria-label="refresh-data-button">
                    {isLoading ? 'Refreshing...' : 'Refresh'}
                  </Button>
                  <Button onClick={handleBackup} aria-label="backup-data-button">
                    Backup
                  </Button>
                  <Button onClick={handleRestore} aria-label="restore-data-button">
                    Restore
                  </Button>
                  <Button onClick={handleClear} variant="destructive" aria-label="clear-data-button">
                    Clear All
                  </Button>
                </div>

                <div className="flex gap-4 items-center">
                  <input
                    type="text"
                    placeholder="Search data..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-md"
                    aria-label="search-data-input"
                  />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'key' | 'size' | 'lastUpdated')}
                    className="px-3 py-2 border rounded-md"
                    aria-label="sort-by-select"
                  >
                    <option value="key">Sort by Key</option>
                    <option value="size">Sort by Size</option>
                    <option value="lastUpdated">Sort by Last Updated</option>
                  </select>
                  <Button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    variant="outline"
                    aria-label="toggle-sort-order-button"
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </Button>
                </div>

                <ScrollArea className="h-[600px] rounded-md border p-4" aria-label="stored-data-scroll-area">
                  <div className="space-y-4">
                    {filteredAndSortedData.map((item) => (
                      <Card key={item.key} aria-label={`stored-item-${item.key}-card`}>
                        <CardHeader>
                          <CardTitle className="text-sm font-mono">{item.key}</CardTitle>
                          <CardDescription>
                            Size: {formatBytes(item.size)} | Last Updated: {item.lastUpdated === 'Unknown' ? 'Unknown' : new Date(item.lastUpdated).toLocaleString()} | Version: {item.version}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <pre className="text-sm overflow-x-auto">
                            {JSON.stringify(item.value, null, 2)}
                          </pre>
                        </CardContent>
                      </Card>
                    ))}
                    {filteredAndSortedData.length === 0 && (
                      <div className="text-center text-gray-500 py-8">
                        {searchTerm ? 'No matching data found' : 'No data stored'}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
} 