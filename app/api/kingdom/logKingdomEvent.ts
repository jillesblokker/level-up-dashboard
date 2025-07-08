import { supabaseServer } from '@/lib/supabase/server-client';

type KingdomEventType = 'quest' | 'challenge' | 'gold' | 'exp' | 'reward';

export async function logKingdomEvent({
  userId,
  eventType,
  relatedId,
  amount,
  context
}: {
  userId: string,
  eventType: KingdomEventType,
  relatedId?: string,
  amount?: number,
  context?: any
}) {
  await supabaseServer.from('kingdom_event_log').insert([{
    user_id: userId,
    event_type: eventType,
    related_id: relatedId,
    amount,
    context,
    created_at: new Date().toISOString()
  }]);
} 