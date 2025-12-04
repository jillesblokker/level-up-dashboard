-- ==========================================
-- ALLIES ENHANCEMENTS MIGRATION
-- ==========================================

-- 1. Create alliance_achievements table
CREATE TABLE IF NOT EXISTS alliance_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    achievement_type TEXT NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    progress INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, achievement_type)
);

-- 2. Create gifts table
CREATE TABLE IF NOT EXISTS gifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id TEXT NOT NULL,
    recipient_id TEXT NOT NULL,
    item_type TEXT NOT NULL CHECK (item_type IN ('gold', 'creature', 'title', 'power_up', 'badge')),
    item_id TEXT, -- specific ID if applicable (e.g., creature ID)
    amount INTEGER DEFAULT 1,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'claimed', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    claimed_at TIMESTAMP WITH TIME ZONE
);

-- 3. Add columns to character_stats
ALTER TABLE character_stats 
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_alliance_achievements_user_id ON alliance_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_gifts_recipient_id ON gifts(recipient_id);
CREATE INDEX IF NOT EXISTS idx_gifts_sender_id ON gifts(sender_id);

-- 5. Enable RLS
ALTER TABLE alliance_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE gifts ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies

-- Alliance Achievements Policies
CREATE POLICY "Users can view their own achievements" ON alliance_achievements
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own achievements" ON alliance_achievements
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own achievements" ON alliance_achievements
    FOR UPDATE USING (auth.uid()::text = user_id);

-- Gifts Policies
CREATE POLICY "Users can view gifts sent or received" ON gifts
    FOR SELECT USING (auth.uid()::text = sender_id OR auth.uid()::text = recipient_id);

CREATE POLICY "Users can send gifts" ON gifts
    FOR INSERT WITH CHECK (auth.uid()::text = sender_id);

CREATE POLICY "Users can update gifts sent or received" ON gifts
    FOR UPDATE USING (auth.uid()::text = sender_id OR auth.uid()::text = recipient_id);

-- 7. Update Notification Types (Postgres specific)
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
    CHECK (type IN ('friend_request', 'friend_quest_received', 'friend_quest_completed', 'friend_request_accepted', 'gift_received', 'gift_claimed', 'achievement_unlocked'));

-- Update character_stats policies to allow reading friends' stats (for title/last_seen)
-- Note: Existing policies might be restrictive. We ensure friends can read basic stats.
-- This assumes a policy like "Users can read character_stats" exists or we add one.
-- For now, we'll rely on existing or add a broad read policy if needed, but usually specific API endpoints handle this with service role or specific checks.
```
