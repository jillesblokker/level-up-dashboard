import { useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';

interface UseSupabaseRealtimeSyncProps {
  table: string;
  userId: string | undefined | null;
  onChange: () => void;
}

export function useSupabaseRealtimeSync({ table, userId, onChange }: UseSupabaseRealtimeSyncProps) {
  useEffect(() => {
    if (!userId) return;
    const supabase = createBrowserClient();
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
          onChange();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, userId, onChange]);
} 