-- Add display_name to character_stats for Leaderboards
ALTER TABLE character_stats
ADD COLUMN IF NOT EXISTS display_name TEXT DEFAULT 'Anonymous Knight';
-- Add index for faster sorting on leaderboards
CREATE INDEX IF NOT EXISTS idx_character_stats_experience ON character_stats(experience DESC);
CREATE INDEX IF NOT EXISTS idx_character_stats_gold ON character_stats(gold DESC);