import { logger } from './logger';
import { supabase } from './supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Centralized Realtime Data Synchronization Manager
// Handles Supabase WebSockets, multi-tab BroadcastChannel, and lifecycle reconnects

export interface RealtimeSyncEvent {
  table: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  payload: any;
  timestamp: number;
}

type SyncCallback = (event: RealtimeSyncEvent) => void;

class RealtimeSyncManager {
  private channels: Map<string, RealtimeChannel> = new Map();
  private listeners: Set<SyncCallback> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;
  private userId: string | null = null;
  private isSubscribed = false;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.broadcastChannel = new BroadcastChannel('thrivehaven_sync');
        this.broadcastChannel.onmessage = (e) => {
          if (e.data && e.data.type === 'REALTIME_SYNC_EVENT') {
            logger.debug('[SYNC] Multi-tab event received:', e.data.event?.table);
            this.notifyListeners(e.data.event);
          }
        };
      } catch {
        /* BroadcastChannel not supported in legacy browser */
      }

      // Handle window focus, tab visibility, and online events
      window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          logger.debug('[SYNC] Tab became visible — verifying realtime channels...');
          this.ensureConnected();
        }
      });

      window.addEventListener('focus', () => {
        logger.debug('[SYNC] Window focused — re-verifying realtime channels...');
        this.ensureConnected();
      });

      window.addEventListener('online', () => {
        logger.debug('[SYNC] Network reconnected — restoring realtime subscriptions...');
        this.ensureConnected(true);
      });
    }
  }

  /**
   * Initializes or updates Realtime subscriptions for the current user.
   */
  public initialize(userId: string) {
    if (!userId) return;
    if (this.userId === userId && this.isSubscribed) return;

    this.userId = userId;
    logger.debug('[SYNC] Initializing Realtime channels for user ID:', userId);

    if (!supabase) {
      logger.warn('[SYNC] Supabase client unavailable — Realtime fallback to polling');
      return;
    }

    // Clear previous channels
    this.unsubscribeAll();

    const tablesToSubscribe = [
      'quest_completion',
      'user_quests',
      'character_stats',
      'streaks',
      'user_preferences',
      'challenges'
    ];

    tablesToSubscribe.forEach((table) => {
      try {
        const channelName = `realtime:${table}:${userId.slice(0, 8)}`;
        const channel = supabase.channel(channelName)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table,
              filter: `user_id=eq.${userId}`,
            },
            (payload) => {
              const syncEvent: RealtimeSyncEvent = {
                table,
                eventType: payload.eventType as any,
                payload: payload.new || payload.old,
                timestamp: Date.now(),
              };

              logger.debug(`[SYNC] Realtime event received [${table}]:`, payload.eventType);

              // Broadcast to local listeners
              this.notifyListeners(syncEvent);

              // Broadcast to other open browser tabs
              if (this.broadcastChannel) {
                try {
                  this.broadcastChannel.postMessage({
                    type: 'REALTIME_SYNC_EVENT',
                    event: syncEvent,
                  });
                } catch { /* ignore */ }
              }
            }
          )
          .subscribe((status, err) => {
            if (status === 'SUBSCRIBED') {
              logger.debug(`[SYNC] Subscribed to table [${table}] successfully`);
            } else if (status === 'CHANNEL_ERROR') {
              logger.warn(`[SYNC] Subscription error on table [${table}]:`, err);
            }
          });

        this.channels.set(table, channel);
      } catch (err) {
        logger.warn(`[SYNC] Failed to subscribe to ${table}:`, err);
      }
    });

    this.isSubscribed = true;
  }

  /**
   * Adds a listener for real-time sync events.
   */
  public subscribe(callback: SyncCallback): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notifies all local component listeners when a change occurs.
   */
  private notifyListeners(event: RealtimeSyncEvent) {
    this.listeners.forEach((callback) => {
      try {
        callback(event);
      } catch (err) {
        logger.error('[SYNC] Error in sync listener callback:', err);
      }
    });
  }

  /**
   * Broadcasts a local mutation event manually across tabs.
   */
  public broadcastLocalMutation(table: string, payload: any) {
    const syncEvent: RealtimeSyncEvent = {
      table,
      eventType: 'UPDATE',
      payload,
      timestamp: Date.now(),
    };
    this.notifyListeners(syncEvent);
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type: 'REALTIME_SYNC_EVENT',
          event: syncEvent,
        });
      } catch { /* ignore */ }
    }
  }

  /**
   * Verifies socket connection and reconnects if dropped.
   */
  public ensureConnected(forceReconnect = false) {
    if (!this.userId) return;
    if (forceReconnect || !this.isSubscribed) {
      this.initialize(this.userId);
    }
  }

  /**
   * Unsubscribes all channels and cleans up memory.
   */
  public unsubscribeAll() {
    this.channels.forEach((channel, table) => {
      try {
        if (supabase) supabase.removeChannel(channel);
      } catch { /* ignore */ }
    });
    this.channels.clear();
    this.isSubscribed = false;
  }
}

export const realtimeSyncManager = new RealtimeSyncManager();
