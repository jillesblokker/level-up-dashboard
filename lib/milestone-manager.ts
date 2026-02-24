import { supabaseServer } from './supabase/server-client';
import { MILESTONE_POOL, EncouragingMessage } from './encouraging-messages';

/**
 * Retrieves a milestone message from the database, with a fallback to hardcoded messages.
 */
export async function getMilestoneMessage(milestoneKey: string): Promise<EncouragingMessage | null> {
    try {
        // 1. Try to fetch from the new milestone_messages table
        const { data, error } = await supabaseServer
            .from('milestone_messages')
            .select('character_name, message')
            .eq('milestone_key', milestoneKey)
            .eq('active', true);

        if (data && data.length > 0) {
            // Pick a random message from the results
            const randomIndex = Math.floor(Math.random() * data.length);
            const selected = data[randomIndex];
            if (selected) {
                return {
                    character: selected.character_name,
                    message: selected.message
                };
            }
        }

        // 2. Fallback to the hardcoded library if not found in DB
        const { getMilestoneMessage: getHardcodedMessage } = await import('./encouraging-messages');
        return getHardcodedMessage(milestoneKey);

    } catch (err) {
        console.warn('Error fetching milestone message from DB:', err);
        // Final fallback to hardcoded if DB fails
        const { getMilestoneMessage: getHardcodedMessage } = await import('./encouraging-messages');
        return getHardcodedMessage(milestoneKey);
    }
}
