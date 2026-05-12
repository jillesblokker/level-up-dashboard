-- Migration: Add missing is_day_bonus and is_night_bonus columns to quest_completion
-- Run this in Supabase SQL Editor

ALTER TABLE quest_completion 
  ADD COLUMN IF NOT EXISTS is_day_bonus BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_night_bonus BOOLEAN DEFAULT FALSE;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
