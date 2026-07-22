/**
 * DAILY ACTIVITY SUMMARY SERVICE
 * 
 * Aggregates daily quest completion data into lightweight snapshots.
 * These snapshots power the activity graphs and history views
 * without requiring full scans of raw completion logs.
 * 
 * Data is stored in localStorage under 'daily-activity-snapshots'
 * as an array of DailySnapshot objects, one per day.
 * 
 * Raw completion logs older than 30 days are compacted into
 * these summaries to keep the active data set small and fast.
 */

import { getUserScopedItem, setUserScopedItem } from './user-scoped-storage';
import { getToday } from './date-utils';

export interface DailySnapshot {
  date: string;         // ISO date string (YYYY-MM-DD)
  questsCompleted: number;
  questsTotal: number;
  xpEarned: number;
  goldEarned: number;
  categoryCounts: Record<string, number>; // e.g. { "Might": 3, "Knowledge": 2 }
  streakDay: number;    // streak count on that day
  activeMinutes: number; // rough estimate from session timestamps
}

const SNAPSHOTS_KEY = 'daily-activity-snapshots';
const RAW_LOG_KEY = 'daily-raw-completions';
const MAX_RAW_DAYS = 30;
const MAX_SNAPSHOT_DAYS = 365;

/**
 * Get today's date as YYYY-MM-DD in Europe/Amsterdam timezone
 */
function todayKey(): string {
  return getToday();
}

/**
 * Get all stored snapshots
 */
export function getSnapshots(): DailySnapshot[] {
  try {
    const raw = getUserScopedItem(SNAPSHOTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Get snapshots for a date range (inclusive). 
 * Used by graph components to render history efficiently.
 */
export function getSnapshotsInRange(startDate: string, endDate: string): DailySnapshot[] {
  const snapshots = getSnapshots();
  return snapshots.filter(s => s.date >= startDate && s.date <= endDate);
}

/**
 * Get the last N days of snapshots (for dashboard widgets)
 */
export function getRecentSnapshots(days: number = 7): DailySnapshot[] {
  const snapshots = getSnapshots();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return snapshots.filter(s => s.date >= cutoffStr);
}

/**
 * Record a quest completion event into today's raw log.
 * Called by the quest completion flow.
 */
export function recordCompletion(event: {
  questId: string;
  category: string;
  xp: number;
  gold: number;
}): void {
  try {
    const today = todayKey();
    const raw = getUserScopedItem(RAW_LOG_KEY);
    const logs: Record<string, Array<typeof event & { timestamp: number }>> = raw ? JSON.parse(raw) : {};

    if (!logs[today]) {
      logs[today] = [];
    }

    logs[today].push({
      ...event,
      timestamp: Date.now(),
    });

    setUserScopedItem(RAW_LOG_KEY, JSON.stringify(logs));
  } catch (error) {
    console.error('[DailyActivitySummary] Failed to record completion:', error);
  }
}

/**
 * Build or update today's snapshot from raw logs.
 * Should be called periodically (e.g. on quest page load, on collection).
 */
export function buildTodaySnapshot(meta: {
  totalQuests: number;
  streakDay: number;
}): DailySnapshot {
  const today = todayKey();
  const snapshots = getSnapshots();

  // Read raw log for today
  let rawLogs: Record<string, Array<{ questId: string; category: string; xp: number; gold: number; timestamp: number }>> = {};
  try {
    const raw = getUserScopedItem(RAW_LOG_KEY);
    rawLogs = raw ? JSON.parse(raw) : {};
  } catch {
    rawLogs = {};
  }

  const todayLogs = rawLogs[today] || [];

  // Build category counts
  const categoryCounts: Record<string, number> = {};
  todayLogs.forEach(log => {
    categoryCounts[log.category] = (categoryCounts[log.category] || 0) + 1;
  });

  // Estimate active minutes from timestamp spread
  let activeMinutes = 0;
  if (todayLogs.length >= 2) {
    const timestamps = todayLogs.map(l => l.timestamp).sort((a, b) => a - b);
    const spread = timestamps[timestamps.length - 1]! - timestamps[0]!;
    activeMinutes = Math.round(spread / 60000);
  } else if (todayLogs.length === 1) {
    activeMinutes = 5; // minimum session
  }

  const snapshot: DailySnapshot = {
    date: today,
    questsCompleted: todayLogs.length,
    questsTotal: meta.totalQuests,
    xpEarned: todayLogs.reduce((sum, l) => sum + l.xp, 0),
    goldEarned: todayLogs.reduce((sum, l) => sum + l.gold, 0),
    categoryCounts,
    streakDay: meta.streakDay,
    activeMinutes,
  };

  // Replace or append today's snapshot
  const existingIdx = snapshots.findIndex(s => s.date === today);
  if (existingIdx >= 0) {
    snapshots[existingIdx] = snapshot;
  } else {
    snapshots.push(snapshot);
  }

  // Trim to max days
  const trimmed = snapshots
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-MAX_SNAPSHOT_DAYS);

  setUserScopedItem(SNAPSHOTS_KEY, JSON.stringify(trimmed));

  return snapshot;
}

/**
 * Compact old raw logs into snapshots.
 * Raw logs older than MAX_RAW_DAYS are aggregated into their daily snapshot
 * and then removed from the raw log store.
 * 
 * This keeps the raw log data small while preserving graph history forever.
 */
export function compactOldLogs(): { compacted: number; remaining: number } {
  try {
    const raw = getUserScopedItem(RAW_LOG_KEY);
    if (!raw) return { compacted: 0, remaining: 0 };

    const logs: Record<string, Array<{ questId: string; category: string; xp: number; gold: number; timestamp: number }>> = JSON.parse(raw);
    const snapshots = getSnapshots();

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - MAX_RAW_DAYS);
    const cutoffStr = cutoff.toISOString().slice(0, 10);

    let compactedCount = 0;
    const keysToRemove: string[] = [];

    for (const [dateKey, dayLogs] of Object.entries(logs)) {
      if (dateKey < cutoffStr) {
        // This day is older than 30 days — ensure it has a snapshot
        const existingSnapshot = snapshots.find(s => s.date === dateKey);
        if (!existingSnapshot) {
          const categoryCounts: Record<string, number> = {};
          dayLogs.forEach(l => {
            categoryCounts[l.category] = (categoryCounts[l.category] || 0) + 1;
          });

          let activeMinutes = 0;
          if (dayLogs.length >= 2) {
            const timestamps = dayLogs.map(l => l.timestamp).sort((a, b) => a - b);
            activeMinutes = Math.round((timestamps[timestamps.length - 1]! - timestamps[0]!) / 60000);
          }

          snapshots.push({
            date: dateKey,
            questsCompleted: dayLogs.length,
            questsTotal: 0, // unknown for past days
            xpEarned: dayLogs.reduce((s, l) => s + l.xp, 0),
            goldEarned: dayLogs.reduce((s, l) => s + l.gold, 0),
            categoryCounts,
            streakDay: 0,
            activeMinutes,
          });
        }

        keysToRemove.push(dateKey);
        compactedCount++;
      }
    }

    // Remove old raw logs
    keysToRemove.forEach(key => delete logs[key]);
    setUserScopedItem(RAW_LOG_KEY, JSON.stringify(logs));

    // Save updated snapshots
    const trimmed = snapshots
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-MAX_SNAPSHOT_DAYS);
    setUserScopedItem(SNAPSHOTS_KEY, JSON.stringify(trimmed));

    return { compacted: compactedCount, remaining: Object.keys(logs).length };
  } catch (error) {
    console.error('[DailyActivitySummary] Compaction failed:', error);
    return { compacted: 0, remaining: 0 };
  }
}
