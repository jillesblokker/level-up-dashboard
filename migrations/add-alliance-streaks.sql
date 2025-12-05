-- Alliance Streaks Implementation
-- Add streak tracking to character_stats

ALTER TABLE character_stats 
ADD COLUMN IF NOT EXISTS alliance_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS alliance_streak_last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS alliance_streak_longest INTEGER DEFAULT 0;

-- Add quest completion tracking to quests table
ALTER TABLE quests
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS completion_notified BOOLEAN DEFAULT FALSE;

-- Create index for efficient streak queries
CREATE INDEX IF NOT EXISTS idx_character_stats_alliance_streak ON character_stats(user_id, alliance_streak_last_updated);

-- Create index for quest completion notifications
CREATE INDEX IF NOT EXISTS idx_quests_sender_completion ON quests(sender_id, completed_at) WHERE is_friend_quest = true;
