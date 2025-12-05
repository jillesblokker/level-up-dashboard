-- 1. Fix 'quests' table columns
ALTER TABLE quests ADD COLUMN IF NOT EXISTS is_custom boolean DEFAULT false;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS is_friend_quest boolean DEFAULT false;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS sender_id text;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS recipient_id text;

CREATE INDEX IF NOT EXISTS idx_quests_sender_id ON quests(sender_id);
CREATE INDEX IF NOT EXISTS idx_quests_recipient_id ON quests(recipient_id);

-- 2. Fix 'alliance_achievements' table constraints
-- Convert user_id to text if it isn't (just in case)
-- ALTER TABLE alliance_achievements ALTER COLUMN user_id TYPE text;

-- Ensure unique constraint exists (drop first to be safe)
ALTER TABLE alliance_achievements DROP CONSTRAINT IF EXISTS unique_user_achievement_type;
ALTER TABLE alliance_achievements ADD CONSTRAINT unique_user_achievement_type UNIQUE (user_id, achievement_type);

-- Enable RLS just in case
ALTER TABLE alliance_achievements ENABLE ROW LEVEL SECURITY;

-- 3. Fix 'notifications' table schema
CREATE TABLE IF NOT EXISTS notifications (
    id bigint generated always as identity primary key,
    user_id text not null,
    type text not null,
    data jsonb default '{}'::jsonb,
    is_read boolean default false,
    created_at timestamp with time zone default now()
);

-- Ensure RLS and Policies for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert notifications" ON notifications;
-- Allow authenticated users to insert notifications (needed for sending quests/notifications to others)
CREATE POLICY "Users can insert notifications" ON notifications
    FOR INSERT WITH CHECK (true); -- Or limit to auth.uid() if sender logic is stored differently, but 'true' is common for peer-to-peer notifications

GRANT ALL ON notifications TO authenticated;
