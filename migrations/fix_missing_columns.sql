-- Fix missing 'title' column in character_stats
-- This script ensures the 'title' column exists to support leaderboard display.
ALTER TABLE character_stats
ADD COLUMN IF NOT EXISTS title TEXT DEFAULT 'Novice';
-- Make sure level exists too
ALTER TABLE character_stats
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;