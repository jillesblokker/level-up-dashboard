-- Safe migration script - only creates what's missing
-- Run this in your Supabase SQL editor

-- 1. Kingdom Grid Table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS kingdom_grid (
  user_id TEXT PRIMARY KEY,
  grid_data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Character Stats Table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS character_stats (
  user_id TEXT PRIMARY KEY,
  stats_data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Quest Progress Table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS quest_progress (
  user_id TEXT PRIMARY KEY,
  progress_data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Challenge Progress Table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS challenge_progress (
  user_id TEXT PRIMARY KEY,
  progress_data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Milestone Progress Table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS milestone_progress (
  user_id TEXT PRIMARY KEY,
  progress_data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to existing tables (if needed)
DO $$ 
BEGIN
  -- Add stats_data column to character_stats if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'character_stats' AND column_name = 'stats_data') THEN
    ALTER TABLE character_stats ADD COLUMN stats_data JSONB;
  END IF;

  -- Add progress_data column to quest_progress if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'quest_progress' AND column_name = 'progress_data') THEN
    ALTER TABLE quest_progress ADD COLUMN progress_data JSONB;
  END IF;

  -- Add progress_data column to challenge_progress if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'challenge_progress' AND column_name = 'progress_data') THEN
    ALTER TABLE challenge_progress ADD COLUMN progress_data JSONB;
  END IF;

  -- Add progress_data column to milestone_progress if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'milestone_progress' AND column_name = 'progress_data') THEN
    ALTER TABLE milestone_progress ADD COLUMN progress_data JSONB;
  END IF;

  -- Add grid_data column to kingdom_grid if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'kingdom_grid' AND column_name = 'grid_data') THEN
    ALTER TABLE kingdom_grid ADD COLUMN grid_data JSONB;
  END IF;

  -- Add updated_at column to all tables if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'character_stats' AND column_name = 'updated_at') THEN
    ALTER TABLE character_stats ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'quest_progress' AND column_name = 'updated_at') THEN
    ALTER TABLE quest_progress ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'challenge_progress' AND column_name = 'updated_at') THEN
    ALTER TABLE challenge_progress ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'milestone_progress' AND column_name = 'updated_at') THEN
    ALTER TABLE milestone_progress ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'kingdom_grid' AND column_name = 'updated_at') THEN
    ALTER TABLE kingdom_grid ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Verify the final structure
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN (
  'character_stats',
  'quest_progress',
  'challenge_progress', 
  'milestone_progress',
  'kingdom_grid'
)
ORDER BY table_name, ordinal_position;
