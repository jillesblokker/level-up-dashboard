import { useEffect } from 'react';
import { useSupabase } from '@/lib/hooks/useSupabase';

interface UseSupabaseRealtimeSyncProps {
  table: string;
  userId: string | undefined | null;
  onChange: () => void;
}

export function useSupabaseRealtimeSync({ table, userId, onChange }: UseSupabaseRealtimeSyncProps) {
  const { supabase, isLoading } = useSupabase();

  useEffect(() => {
    if (!userId || isLoading || !supabase) return;
    
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
  }, [table, userId, onChange, supabase, isLoading]);
} 