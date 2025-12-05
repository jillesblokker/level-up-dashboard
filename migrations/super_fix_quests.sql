-- SUPER FIX: Add ALL missing columns to quests table and reload schema

-- 1. Ensure all columns exist (idempotent)
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
ALTER TABLE quests ADD COLUMN IF NOT EXISTS user_id text;

-- 2. Add Indexes
CREATE INDEX IF NOT EXISTS idx_quests_sender_id ON quests(sender_id);
CREATE INDEX IF NOT EXISTS idx_quests_recipient_id ON quests(recipient_id);

-- 3. Grant Permissions
GRANT ALL ON quests TO authenticated;

-- 4. Force Schema Cache Reload (Important for PGRST204 errors)
NOTIFY pgrst, 'reload schema';
