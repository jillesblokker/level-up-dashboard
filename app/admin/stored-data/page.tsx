"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { unwrapApiResponse } from "@/lib/api-response-unwrapper";
import { getUserScopedItem, setUserScopedItem } from "@/lib/user-scoped-storage";
import { characterStatsService } from "@/lib/character-stats-service";
import { calculateLevelFromExperience } from "@/lib/level-utils";
import { logger } from "@/lib/logger";
import {
  GitCommit,
  Database,
  RefreshCw,
  Download,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Server,
  Layers,
  Sparkles,
  Clock
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface VersionInfo {
  version: string;
  timestamp: string;
  env: string;
}

interface StatComparison {
  name: string;
  localValue: string | number;
  serverValue: string | number;
  status: "synced" | "local-ahead" | "server-ahead" | "error";
}

export default function AdminStoredDataPage() {
  const { user } = useUser();
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [comparisons, setComparisons] = useState<StatComparison[]>([]);
  const [serverStats, setServerStats] = useState<any>(null);
  const [lastServerSyncTime, setLastServerSyncTime] = useState<string | null>(null);

  // Interactive Discrepancy Pop-up Modal State
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [conflictItem, setConflictItem] = useState<{
    name: string;
    localVal: string | number;
    serverVal: string | number;
    highestVal: string | number;
    localNum: number;
    serverNum: number;
  }>({
    name: "Completed Quests (Today)",
    localVal: 0,
    serverVal: 0,
    highestVal: 0,
    localNum: 0,
    serverNum: 0
  });

  // Fetch live Git commit version
  const fetchVersion = async () => {
    try {
      const res = await fetch('/api/version', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setVersionInfo(data);
      }
    } catch (e) {
      logger.error('Failed to fetch build version:', e);
    }
  };

  // Compare local vs server data
  const compareData = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      // 1. Get Local Storage State
      const currentLocalStats = characterStatsService.getStats();

      // Local quest completions count
      const cachedQuestsStr = getUserScopedItem('quests-cache') || localStorage.getItem('quests-cache');
      let localQuestsCount = 0;
      if (cachedQuestsStr) {
        try {
          const parsed = JSON.parse(cachedQuestsStr);
          if (Array.isArray(parsed)) {
            localQuestsCount = parsed.filter((q: any) => q.completed || q.is_completed || q.completed_today).length;
          }
        } catch {}
      }

      // Local Inventory count
      const cachedInvStr = getUserScopedItem('inventory');
      let localInvCount = 0;
      if (cachedInvStr) {
        try {
          const parsed = JSON.parse(cachedInvStr);
          if (Array.isArray(parsed)) localInvCount = parsed.length;
        } catch {}
      }

      // Local Daily Fate card
      const cachedFateStr = getUserScopedItem('daily_fate') || localStorage.getItem('daily_fate');
      let localFateStatus = "None";
      if (cachedFateStr) {
        try {
          const parsed = typeof cachedFateStr === 'string' ? JSON.parse(cachedFateStr) : cachedFateStr;
          const title = parsed?.title || parsed?.card?.title || parsed?.card || parsed?.name || (typeof parsed === 'string' ? parsed : null);
          localFateStatus = title ? `Drawn (${typeof title === 'object' ? (title.title || title.name || 'Card') : title})` : "Drawn";
        } catch {
          localFateStatus = "Drawn";
        }
      }

      // 2. Fetch Server State from Supabase
      const resStats = await fetchWithAuth('/api/character-stats');
      let currentServerStats: any = null;
      if (resStats.ok) {
        const rawJson = await resStats.json();
        const unwrappedStats = unwrapApiResponse<any>(rawJson);
        currentServerStats = unwrappedStats ? { ...unwrappedStats, ...(unwrappedStats.stats || {}) } : null;
        setServerStats(currentServerStats);
      }

      // Server quest completions count
      const resQuests = await fetchWithAuth(`/api/quests?t=${Date.now()}`);
      let serverQuestsCount = 0;
      if (resQuests.ok) {
        const rawQuestJson = await resQuests.json();
        const questData = unwrapApiResponse<any>(rawQuestJson);
        const questArray = Array.isArray(questData) ? questData : (questData?.quests || []);
        serverQuestsCount = questArray.filter((q: any) => q.completed || q.is_completed || q.completed_today).length;
      }

      // Server inventory count
      const resInv = await fetchWithAuth('/api/inventory');
      let serverInvCount = 0;
      if (resInv.ok) {
        const rawInv = await resInv.json();
        const invData = unwrapApiResponse<any>(rawInv);
        const invArray = Array.isArray(invData) ? invData : (invData?.data || []);
        serverInvCount = invArray.length;
      }

      // Server Daily Fate card
      const resFate = await fetchWithAuth('/api/user-preferences?key=daily_fate');
      let serverFateStatus = "None";
      if (resFate.ok) {
        const rawFate = await resFate.json();
        const fateData = unwrapApiResponse<any>(rawFate);
        const val = fateData?.value || fateData?.preference_value || fateData;
        if (val) {
          const title = val?.title || val?.card?.title || val?.card || val?.name || (typeof val === 'string' ? val : null);
          serverFateStatus = title ? `Drawn (${typeof title === 'object' ? (title.title || title.name || 'Card') : title})` : "Drawn";
        }
      }

      // Server Challenges count (/api/challenges)
      const resChall = await fetchWithAuth('/api/challenges');
      let serverChallCount = 0;
      if (resChall.ok) {
        const rawChall = await resChall.json();
        const challData = unwrapApiResponse<any>(rawChall);
        const challArray = Array.isArray(challData) ? challData : (challData?.challenges || []);
        serverChallCount = challArray.filter((c: any) => c.completed || c.is_completed || c.progress >= 100).length;
      }

      // Server Milestones count (/api/milestone-progress)
      const resMile = await fetchWithAuth('/api/milestone-progress');
      let serverMileCount = 0;
      if (resMile.ok) {
        const rawMile = await resMile.json();
        const mileData = unwrapApiResponse<any>(rawMile);
        const progressObj = mileData?.progress || mileData || {};
        if (Array.isArray(progressObj)) {
          serverMileCount = progressObj.filter((m: any) => m.completed || m >= 100).length;
        } else if (progressObj && typeof progressObj === 'object') {
          serverMileCount = Object.values(progressObj).filter((m: any) => 
            m === true || (m && typeof m === 'object' && (m.completed || m.is_completed || m.progress >= 100))
          ).length;
        }
      }

      // 3. Build Comparisons
      const localXP = currentLocalStats.experience || 0;
      const serverXP = currentServerStats?.experience || 0;

      const localGold = currentLocalStats.gold || 0;
      const serverGold = currentServerStats?.gold || 0;

      const localLvl = calculateLevelFromExperience(localXP);
      const serverLvl = calculateLevelFromExperience(serverXP);

      const items: StatComparison[] = [
        {
          name: "Character Level",
          localValue: `Level ${localLvl}`,
          serverValue: `Level ${serverLvl}`,
          status: localLvl === serverLvl ? "synced" : serverLvl > localLvl ? "server-ahead" : "local-ahead"
        },
        {
          name: "Total Experience (XP)",
          localValue: `${localXP.toLocaleString()} XP`,
          serverValue: `${serverXP.toLocaleString()} XP`,
          status: localXP === serverXP ? "synced" : serverXP > localXP ? "server-ahead" : "local-ahead"
        },
        {
          name: "Gold Balance",
          localValue: `${localGold.toLocaleString()} Gold`,
          serverValue: `${serverGold.toLocaleString()} Gold`,
          status: localGold === serverGold ? "synced" : serverGold > localGold ? "server-ahead" : "local-ahead"
        },
        {
          name: "Completed Quests (Today)",
          localValue: `${localQuestsCount} completed`,
          serverValue: `${serverQuestsCount} completed`,
          status: localQuestsCount === serverQuestsCount ? "synced" : serverQuestsCount > localQuestsCount ? "server-ahead" : "local-ahead"
        },
        {
          name: "Completed Weekly Challenges",
          localValue: `${serverChallCount} completed`,
          serverValue: `${serverChallCount} completed`,
          status: "synced"
        },
        {
          name: "Completed Cumulative Milestones",
          localValue: `${serverMileCount} completed`,
          serverValue: `${serverMileCount} completed`,
          status: "synced"
        },
        {
          name: "Inventory Items Total",
          localValue: `${localInvCount} items`,
          serverValue: `${serverInvCount} items`,
          status: localInvCount === serverInvCount ? "synced" : serverInvCount > localInvCount ? "server-ahead" : "local-ahead"
        },
        {
          name: "Daily Fate Tarot Card",
          localValue: localFateStatus,
          serverValue: serverFateStatus,
          status: localFateStatus === serverFateStatus ? "synced" : "server-ahead"
        }
      ];

      setComparisons(items);
      const now = new Date();
      setLastServerSyncTime(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' Local');
    } catch (err: any) {
      toast.error('Error fetching state comparison: ' + (err.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  // Pull Server Truth -> Local Storage (Comprehensive Pull for All Data Types)
  const handlePullServerToLocal = async () => {
    if (!user?.id) return;
    setIsSyncing(true);
    try {
      // 1. Character Stats (Level, Gold, EXP, Essences)
      const merged = await characterStatsService.fetchAndMerge();

      // 2. Today's Checked Quests & Reconciled Push Sync
      const resPreQuests = await fetchWithAuth(`/api/quests?t=${Date.now()}`);
      let serverQuestList: any[] = [];
      if (resPreQuests.ok) {
        const rawPre = await resPreQuests.json();
        const preData = unwrapApiResponse<any>(rawPre);
        serverQuestList = Array.isArray(preData) ? preData : (preData?.quests || []);
      }

      // Build Name-to-UUID map from server quests
      const nameToUuidMap = new Map<string, string>();
      serverQuestList.forEach(sq => {
        if (sq.id && sq.name) {
          nameToUuidMap.set(String(sq.name).toLowerCase().trim(), sq.id);
        }
        if (sq.id && sq.title) {
          nameToUuidMap.set(String(sq.title).toLowerCase().trim(), sq.id);
        }
      });

      const localQuestsStr = getUserScopedItem('quests-cache') || localStorage.getItem('quests-cache');
      const todayStr = new Intl.DateTimeFormat('en-CA').format(new Date());

      if (localQuestsStr) {
        try {
          const localArray: any[] = JSON.parse(localQuestsStr);
          if (Array.isArray(localArray)) {
            for (const lq of localArray) {
              if (lq.completed) {
                // Resolve local quest name to server UUID
                const lqName = String(lq.name || lq.title || '').toLowerCase().trim();
                const targetQuestId = nameToUuidMap.get(lqName) || lq.id;

                await fetchWithAuth('/api/quests/smart-completion', {
                  method: 'POST',
                  body: JSON.stringify({
                    questId: targetQuestId,
                    completed: true,
                    xpReward: lq.xp || 50,
                    goldReward: lq.gold || 25
                  })
                }).catch(() => {});
              }
            }
          }
        } catch {}
      }

      const resQuests = await fetchWithAuth(`/api/quests?t=${Date.now()}`);
      if (resQuests.ok) {
        const rawQuests = await resQuests.json();
        const questData = unwrapApiResponse<any>(rawQuests);
        const serverQuests = Array.isArray(questData) ? questData : (questData?.quests || []);

        let localArray: any[] = [];
        try {
          if (localQuestsStr) localArray = JSON.parse(localQuestsStr);
        } catch {}

        // NEVER-WIPE GUARD: Retain local completed status so local is NEVER wiped to 0
        const mergedQuests = (serverQuests.length > 0 ? serverQuests : localArray).map((sq: any) => {
          const sqName = String(sq.name || sq.title || '').toLowerCase().trim();
          const localMatch = (localArray || []).find((lq: any) => {
            const lqName = String(lq.name || lq.title || '').toLowerCase().trim();
            return (lq.id && lq.id === sq.id) || (lqName && lqName === sqName);
          });

          const isCompleted = Boolean(sq.completed || localMatch?.completed);
          return {
            ...sq,
            completed: isCompleted
          };
        });

        setUserScopedItem('quests-cache', JSON.stringify(mergedQuests));
        setUserScopedItem('quests-cache-date', todayStr);
      }

      // 3. Daily Fate Tarot Card
      const resFate = await fetchWithAuth('/api/user-preferences?preference_key=daily_fate');
      if (resFate.ok) {
        const rawFate = await resFate.json();
        const fateData = unwrapApiResponse<any>(rawFate);
        if (fateData && (fateData.preference_value || fateData.card)) {
          const val = fateData.preference_value || fateData;
          setUserScopedItem('daily_fate', JSON.stringify(val));
          localStorage.setItem('daily_fate', JSON.stringify(val));
        }
      }

      // 4. Realm Map Grid Tiles
      const resTiles = await fetchWithAuth('/api/realm-tiles');
      if (resTiles.ok) {
        const rawTiles = await resTiles.json();
        const tileData = unwrapApiResponse<any>(rawTiles);
        const tilesArray = Array.isArray(tileData) ? tileData : (tileData?.tiles || []);
        if (tilesArray.length > 0) {
          setUserScopedItem('realm-tiles', JSON.stringify(tilesArray));
        }
      }

      // 5. Inventory Items
      const resInv = await fetchWithAuth('/api/inventory');
      if (resInv.ok) {
        const rawInv = await resInv.json();
        const invData = unwrapApiResponse<any>(rawInv);
        const invArray = Array.isArray(invData) ? invData : (invData?.data || []);
        setUserScopedItem('inventory', JSON.stringify(invArray));
      }

      // 6. Broadcast Events
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('global-sync-tick'));
        window.dispatchEvent(new Event('character-stats-update'));
        window.dispatchEvent(new Event('quest-added'));
        window.dispatchEvent(new Event('character-inventory-update'));
      }

      toast.success(`Successfully pulled Supabase truth for stats, quests, daily fate & map tiles! Level: ${merged.level}, Gold: ${merged.gold.toLocaleString()}`);
      await compareData();
    } catch (err: any) {
      toast.error('Failed to pull server data: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  // User clicked "Pull Supabase Truth to Local" -> Check for Discrepancies and prompt Modal if needed
  const handlePullServerClick = () => {
    const questComp = comparisons.find(c => c.name.includes('Completed Quests'));
    const localValStr = String(questComp?.localValue || '0');
    const serverValStr = String(questComp?.serverValue || '0');
    const localNum = parseInt(localValStr) || 0;
    const serverNum = parseInt(serverValStr) || 0;

    if (localNum !== serverNum && (localNum > 0 || serverNum > 0)) {
      const highest = Math.max(localNum, serverNum);
      setConflictItem({
        name: "Completed Quests (Today)",
        localVal: `${localNum} completed`,
        serverVal: `${serverNum} completed`,
        highestVal: `${highest} completed`,
        localNum,
        serverNum
      });
      setConflictModalOpen(true);
    } else {
      handlePullServerToLocal();
    }
  };

  // User confirmed modal action: "Use Highest Count"
  const handleConfirmSyncHighest = async () => {
    setConflictModalOpen(false);
    await handlePullServerToLocal();
  };

  // Push Local State -> Server
  const handlePushLocalToServer = async () => {
    if (!user?.id) return;
    setIsSyncing(true);
    try {
      const local = characterStatsService.getStats();
      const res = await fetchWithAuth('/api/character-stats', {
        method: 'POST',
        body: JSON.stringify({
          stats: local
        })
      });
      if (res.ok) {
        toast.success('Successfully pushed local stats to Supabase!');
        await compareData();
      } else {
        toast.error('Failed to push to server: HTTP ' + res.status);
      }
    } catch (err: any) {
      toast.error('Push failed: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  // Download JSON Backup Snapshot
  const handleDownloadBackup = () => {
    try {
      const localData = characterStatsService.getStats();
      const backupObj = {
        userId: user?.id,
        timestamp: new Date().toISOString(),
        buildVersion: versionInfo?.version || 'unknown',
        localStats: localData,
        serverStats,
        comparisons,
      };

      const blob = new Blob([JSON.stringify(backupObj, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `thrivehaven_backup_${user?.id}_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Backup JSON snapshot downloaded!');
    } catch (e: any) {
      toast.error('Failed to create backup: ' + e.message);
    }
  };

  // Clear local browser cache safely
  const handleClearLocalCache = () => {
    if (!confirm('Clear local browser storage for this user? Server data in Supabase will remain untouched.')) return;
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('character-stats') || key.includes('quests-cache'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
      toast.success('Cleared local storage cache!');
      compareData();
    } catch (e: any) {
      toast.error('Error clearing local cache: ' + e.message);
    }
  };

  useEffect(() => {
    fetchVersion();
    if (user?.id) {
      compareData();
    }
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-black text-amber-50/90 p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-amber-500/20 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-amber-400 flex items-center gap-3">
            <Database className="w-8 h-8 text-amber-400" />
            Data Storage & Resolution Control Center
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Compare local browser cache vs. Supabase server truth. Resolve sync conflicts with 1 tap.
          </p>
        </div>

        {/* Live Build Version & Sync Timestamp Badge */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {lastServerSyncTime && (
            <div className="flex items-center gap-2 bg-zinc-900/80 border border-emerald-500/30 px-3 py-2 rounded-xl text-xs">
              <Clock className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="text-zinc-400">Last Server Sync: </span>
                <span className="font-mono text-emerald-300 font-bold">{lastServerSyncTime}</span>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 bg-zinc-900/80 border border-amber-500/30 px-4 py-2 rounded-xl">
            <GitCommit className="w-5 h-5 text-emerald-400 animate-pulse" />
            <div className="text-xs">
              <div className="text-zinc-400">Live Git Build</div>
              <div className="font-mono text-emerald-400 font-bold">#{versionInfo?.version || 'f7a16d7f'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* User Info Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-zinc-900/60 border-amber-500/20 text-zinc-200">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <Server className="w-4 h-4 text-amber-400" /> Active User ID
            </CardTitle>
          </CardHeader>
          <CardContent className="py-1 px-4 text-sm font-mono text-amber-300 truncate">
            {user?.id || 'Not Authenticated'}
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/60 border-amber-500/20 text-zinc-200">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Auth Status
            </CardTitle>
          </CardHeader>
          <CardContent className="py-1 px-4 text-sm font-semibold text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Logged In via Clerk
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/60 border-amber-500/20 text-zinc-200">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-amber-400" /> Quick Refresh
            </CardTitle>
          </CardHeader>
          <CardContent className="py-1 px-4">
            <Button
              size="sm"
              variant="outline"
              onClick={compareData}
              disabled={isLoading}
              className="w-full text-xs border-amber-500/30 text-amber-300 hover:bg-amber-500/20"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Re-Compare Data Sources
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Main Side-by-Side Comparison Matrix */}
      <Card className="bg-zinc-900/90 border-amber-500/30 text-amber-50">
        <CardHeader className="border-b border-amber-500/20">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-amber-400 flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                Data Comparison Matrix: Local vs. Supabase Server
              </CardTitle>
              <CardDescription className="text-zinc-400 text-xs mt-1">
                Inspect exact data points across storage layers. If local storage is stale, click &quot;Pull Supabase Truth&quot;.
              </CardDescription>
            </div>
            <Button
              onClick={handlePullServerClick}
              disabled={isSyncing}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg text-sm"
            >
              <Download className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              Pull Supabase Truth to Local (Recommended)
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-950/80 border-b border-amber-500/20 text-xs text-amber-400 uppercase tracking-wider">
                <th className="p-4 font-bold">Data Item</th>
                <th className="p-4 font-bold text-zinc-300">Local Browser Cache</th>
                <th className="p-4 font-bold text-emerald-400">Supabase Server DB</th>
                <th className="p-4 font-bold text-center">Sync Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-sm">
              {comparisons.map((row, idx) => (
                <tr key={idx} className="hover:bg-amber-500/5 transition-colors">
                  <td className="p-4 font-medium text-amber-200 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400/70" />
                    {row.name}
                  </td>
                  <td className="p-4 font-mono text-zinc-300">{row.localValue}</td>
                  <td className="p-4 font-mono text-emerald-300 font-semibold">{row.serverValue}</td>
                  <td className="p-4 text-center">
                    {row.status === 'synced' ? (
                      <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Synced
                      </Badge>
                    ) : row.status === 'server-ahead' ? (
                      <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40">
                        <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Supabase Ahead
                      </Badge>
                    ) : (
                      <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/40">
                        Local Ahead
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Action Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-zinc-900/60 border-emerald-500/30">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
              <Download className="w-4 h-4" /> 1. Overwrite Local with Server
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-4 space-y-2">
            <p className="text-xs text-zinc-400">
              Replaces local browser storage with Supabase database truth (Level 46, gold, quests).
            </p>
            <Button
              onClick={handlePullServerToLocal}
              disabled={isSyncing}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
            >
              Apply Supabase Server Truth
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/60 border-amber-500/20">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-semibold text-amber-400 flex items-center gap-2">
              <Download className="w-4 h-4" /> 2. Download JSON Backup
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-4 space-y-2">
            <p className="text-xs text-zinc-400">
              Export a `.json` backup file of all current state before modifying data.
            </p>
            <Button
              onClick={handleDownloadBackup}
              variant="outline"
              className="w-full border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-xs font-semibold"
            >
              Export State Backup (.json)
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/60 border-rose-500/30">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-semibold text-rose-400 flex items-center gap-2">
              <Trash2 className="w-4 h-4" /> 3. Clear Local Storage
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-4 space-y-2">
            <p className="text-xs text-zinc-400">
              Clears local cache keys for this user. Server data in Supabase stays intact.
            </p>
            <Button
              onClick={handleClearLocalCache}
              variant="outline"
              className="w-full border-rose-500/40 text-rose-300 hover:bg-rose-500/20 text-xs font-semibold"
            >
              Clear Local Browser Cache
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Sync to Highest Count Pop-Up Modal */}
      <Dialog open={conflictModalOpen} onOpenChange={setConflictModalOpen}>
        <DialogContent className="max-w-md border-amber-500/40 bg-zinc-950 text-amber-50 shadow-2xl rounded-2xl p-6 font-serif">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-amber-400 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
              Sync Data Conflict Detected
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs mt-1">
              A discrepancy was detected between your Local Cache and Supabase Server DB. Thrivehaven will reconcile your progress to the highest count to prevent data wipeout.
            </DialogDescription>
          </DialogHeader>

          <div className="my-4 space-y-3">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-zinc-900/90 border border-zinc-800 p-3 rounded-xl">
                <div className="text-zinc-400 mb-1">📱 Local Cache</div>
                <div className="font-mono text-amber-300 font-bold text-sm">{conflictItem.localVal}</div>
              </div>
              <div className="bg-zinc-900/90 border border-zinc-800 p-3 rounded-xl">
                <div className="text-zinc-400 mb-1">☁️ Supabase Server DB</div>
                <div className="font-mono text-emerald-300 font-bold text-sm">{conflictItem.serverVal}</div>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl text-xs flex items-center justify-between">
              <div className="text-amber-300 font-semibold">🏆 Target Sync Value:</div>
              <div className="font-mono text-emerald-400 font-bold text-sm">{conflictItem.highestVal}</div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button
              variant="ghost"
              onClick={() => setConflictModalOpen(false)}
              className="w-full sm:w-auto text-zinc-400 hover:text-zinc-200 border border-zinc-800 text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSyncHighest}
              disabled={isSyncing}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Use Highest Count ({conflictItem.highestVal})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}