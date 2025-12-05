-- Add missing columns to quests table for friend quests

ALTER TABLE quests ADD COLUMN IF NOT EXISTS is_custom boolean DEFAULT false;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS is_friend_quest boolean DEFAULT false;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS sender_id text;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS recipient_id text;

-- Add index for sender_id to speed up achievement checks
CREATE INDEX IF NOT EXISTS idx_quests_sender_id ON quests(sender_id);
CREATE INDEX IF NOT EXISTS idx_quests_recipient_id ON quests(recipient_id);
