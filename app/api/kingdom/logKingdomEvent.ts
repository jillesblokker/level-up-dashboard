import { supabaseServer } from '../../../pages/api/server-client';

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
  console.log('[logKingdomEvent] Inserting event:', { userId, eventType, relatedId, amount, context });
  const { data, error } = await supabaseServer.from('kingdom_event_log').insert([{
    user_id: userId,
    event_type: eventType,
    related_id: relatedId,
    amount,
    context,
    created_at: new Date().toISOString()
  }]);
  if (error) {
    console.error('[logKingdomEvent] Insert error:', error);
  } else {
    console.log('[logKingdomEvent] Inserted event:', data);
  }
} 