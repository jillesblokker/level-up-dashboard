-- Add alliance streak columns to character_stats

ALTER TABLE character_stats ADD COLUMN IF NOT EXISTS alliance_streak integer DEFAULT 0;
ALTER TABLE character_stats ADD COLUMN IF NOT EXISTS alliance_streak_last_updated timestamp with time zone;
ALTER TABLE character_stats ADD COLUMN IF NOT EXISTS alliance_streak_longest integer DEFAULT 0;
