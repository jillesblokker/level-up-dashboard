-- Performance optimization indexes for Level Up Dashboard
-- Run this migration to improve query performance

-- Index for quest completion lookups by user and date
CREATE INDEX IF NOT EXISTS idx_quest_completion_user_date 
ON quest_completion(user_id, completed_at DESC);

-- Index for quest completion lookups by user and quest
CREATE INDEX IF NOT EXISTS idx_quest_completion_user_quest 
ON quest_completion(user_id, quest_id);

-- Index for character stats lookups
CREATE INDEX IF NOT EXISTS idx_character_stats_user_updated 
ON character_stats(user_id, updated_at DESC);

-- Index for property timers lookups
CREATE INDEX IF NOT EXISTS idx_property_timers_user_position 
ON property_timers(user_id, x, y);

-- Index for challenge completions by user and date
CREATE INDEX IF NOT EXISTS idx_challenge_completion_user_date 
ON challenge_completion(user_id, completed_at DESC);

-- Composite index for daily challenge queries
CREATE INDEX IF NOT EXISTS idx_challenge_completion_user_challenge_date 
ON challenge_completion(user_id, challenge_id, completed_at DESC);

-- Add comments for documentation
COMMENT ON INDEX idx_quest_completion_user_date IS 'Optimizes daily quest completion queries';
COMMENT ON INDEX idx_quest_completion_user_quest IS 'Optimizes individual quest status lookups';
COMMENT ON INDEX idx_character_stats_user_updated IS 'Optimizes character stats sync queries';
COMMENT ON INDEX idx_property_timers_user_position IS 'Optimizes kingdom grid timer lookups';
COMMENT ON INDEX idx_challenge_completion_user_date IS 'Optimizes daily challenge queries';
COMMENT ON INDEX idx_challenge_completion_user_challenge_date IS 'Optimizes specific challenge status checks';
