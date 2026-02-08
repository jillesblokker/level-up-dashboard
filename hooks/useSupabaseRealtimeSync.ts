import { useEffect, useRef } from 'react';
import { useSupabase } from '@/lib/hooks/useSupabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseSupabaseRealtimeSyncProps {
  table: string;
  userId: string | undefined | null;
  onChange: () => void;
}

export function useSupabaseRealtimeSync({ table, userId, onChange }: UseSupabaseRealtimeSyncProps) {
  const { supabase, isLoading } = useSupabase();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!userId || isLoading || !supabase) return;

    // Wrap in try-catch to handle iOS Safari "The operation is insecure" errors
    // that can occur when Supabase realtime tries to access localStorage
    try {
      const channel = supabase.channel(`${table}-realtime`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table,
            filter: `user_id=eq.${userId}`,
          },
          () => {
            // Wrap callback in try-catch as well
            try {
              onChange();
            } catch (callbackError) {
              console.warn(`[RealtimeSync] Callback error for ${table}:`, callbackError);
            }
          }
        )
        .subscribe((status, err) => {
          if (err) {
            console.warn(`[RealtimeSync] Subscription error for ${table}:`, err);
          }
        });

      channelRef.current = channel;
    } catch (error) {
      // Log but don't crash - realtime updates won't work but component will still function
      console.warn(`[RealtimeSync] Failed to subscribe to ${table} - realtime updates disabled:`, error);
    }

    return () => {
      if (channelRef.current && supabase) {
        try {
          supabase.removeChannel(channelRef.current);
        } catch (cleanupError) {
          // Ignore cleanup errors
          console.warn(`[RealtimeSync] Cleanup error for ${table}:`, cleanupError);
        }
        channelRef.current = null;
      }
    };
  }, [table, userId, onChange, supabase, isLoading]);
} 