-- Migration for extended social features: Visitation, Social Feed, Ally Quests, and The Inn
-- 1. Create social_events table for the Herald's Feed
CREATE TABLE IF NOT EXISTS social_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    username TEXT,
    type TEXT NOT NULL,
    -- 'achievement', 'quest_completed', 'milestone', 'rare_find', 'level_up'
    content TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Enable RLS for social_events
ALTER TABLE social_events ENABLE ROW LEVEL SECURITY;
-- Friends can view social events
CREATE POLICY "Friends can view social events" ON social_events FOR
SELECT USING (
        auth.uid()::text = user_id
        OR EXISTS (
            SELECT 1
            FROM friends
            WHERE status = 'accepted'
                AND (
                    (
                        user_id = auth.uid()::text
                        AND friend_id = social_events.user_id
                    )
                    OR (
                        friend_id = auth.uid()::text
                        AND user_id = social_events.user_id
                    )
                )
        )
    );
-- Users can insert their own events
CREATE POLICY "Users can insert their own events" ON social_events FOR
INSERT WITH CHECK (auth.uid()::text = user_id);
-- 2. Create inn_posts table for The Inn
CREATE TABLE IF NOT EXISTS inn_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id TEXT NOT NULL,
    author_name TEXT,
    content TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'note',
    -- 'note', 'bounty', 'trade'
    tags TEXT [],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Enable RLS for inn_posts
ALTER TABLE inn_posts ENABLE ROW LEVEL SECURITY;
-- Everyone can read inn posts (it's a global hub)
CREATE POLICY "Anyone can read inn posts" ON inn_posts FOR
SELECT USING (true);
-- Users can insert their own posts
CREATE POLICY "Users can insert their own inn posts" ON inn_posts FOR
INSERT WITH CHECK (auth.uid()::text = author_id);
-- 3. Update quests table for Ally Quests
ALTER TABLE quests
ADD COLUMN IF NOT EXISTS is_ally_quest BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS ally_id TEXT;
-- The user ID of the partner for the quest
-- 4. Add index for social events performance
CREATE INDEX IF NOT EXISTS idx_social_events_user_id ON social_events(user_id);
CREATE INDEX IF NOT EXISTS idx_inn_posts_created_at ON inn_posts(created_at DESC);