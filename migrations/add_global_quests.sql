-- Add is_global and is_active columns to quests table
ALTER TABLE quests
ADD COLUMN IF NOT EXISTS is_global BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
-- Create an index for faster querying of global quests
CREATE INDEX IF NOT EXISTS idx_quests_global_active ON quests(is_global, is_active);
-- Function to sync global quests for a user
-- This can be called when a user fetches their quests
CREATE OR REPLACE FUNCTION sync_global_quests(target_user_id TEXT) RETURNS void AS $$ BEGIN
INSERT INTO user_quests (
        user_id,
        quest_id,
        status,
        progress,
        created_at,
        updated_at
    )
SELECT target_user_id,
    q.id,
    'not_started',
    0,
    NOW(),
    NOW()
FROM quests q
WHERE q.is_global = true
    AND q.is_active = true
    AND NOT EXISTS (
        SELECT 1
        FROM user_quests uq
        WHERE uq.user_id = target_user_id
            AND uq.quest_id = q.id
    );
END;
$$ LANGUAGE plpgsql;