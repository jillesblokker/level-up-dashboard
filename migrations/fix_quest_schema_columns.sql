-- Fix Quests Table Schema

-- Ensure 'quests' table has all standard columns required by the API
ALTER TABLE quests ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS difficulty text;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS xp_reward integer DEFAULT 50;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS gold_reward integer DEFAULT 10;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS is_custom boolean DEFAULT false;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS is_friend_quest boolean DEFAULT false;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS sender_id text;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS recipient_id text;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS user_id text; -- required for ownership

-- Indexes
CREATE INDEX IF NOT EXISTS idx_quests_sender_id ON quests(sender_id);
CREATE INDEX IF NOT EXISTS idx_quests_recipient_id ON quests(recipient_id);
