-- Custom migration for your existing database structure
-- This works with your existing character_stats table

-- 1. Create missing tables (only if they don't exist)
CREATE TABLE IF NOT EXISTS quest_progress (
  user_id TEXT PRIMARY KEY,
  progress_data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS milestone_progress (
  user_id TEXT PRIMARY KEY,
  progress_data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kingdom_grid (
  user_id TEXT PRIMARY KEY,
  grid_data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Update your existing character_stats table to work with the new API
-- Add a stats_data column if it doesn't exist (for backward compatibility)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'character_stats' AND column_name = 'stats_data') THEN
    ALTER TABLE character_stats ADD COLUMN stats_data JSONB;
  END IF;
END $$;

-- 3. Create a view that combines your existing character_stats with the new JSONB format
-- This allows the API to work with both old and new data
CREATE OR REPLACE VIEW character_stats_unified AS
SELECT 
  user_id,
  COALESCE(
    stats_data,
    jsonb_build_object(
      'gold', gold,
      'experience', experience,
      'level', level,
      'health', health,
      'max_health', max_health,
      'character_name', character_name
    )
  ) as stats_data,
  updated_at
FROM character_stats;

-- 4. Create a function to sync data between old and new formats
CREATE OR REPLACE FUNCTION sync_character_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- When stats_data is updated, also update the individual columns
  IF NEW.stats_data IS NOT NULL THEN
    NEW.gold = COALESCE((NEW.stats_data->>'gold')::integer, 0);
    NEW.experience = COALESCE((NEW.stats_data->>'experience')::integer, 0);
    NEW.level = COALESCE((NEW.stats_data->>'level')::integer, 1);
    NEW.health = COALESCE((NEW.stats_data->>'health')::integer, 100);
    NEW.max_health = COALESCE((NEW.stats_data->>'max_health')::integer, 100);
    NEW.character_name = COALESCE(NEW.stats_data->>'character_name', 'Adventurer');
  END IF;
  
  -- When individual columns are updated, also update stats_data
  IF NEW.stats_data IS NULL OR 
     NEW.gold != COALESCE((NEW.stats_data->>'gold')::integer, 0) OR
     NEW.experience != COALESCE((NEW.stats_data->>'experience')::integer, 0) OR
     NEW.level != COALESCE((NEW.stats_data->>'level')::integer, 1) OR
     NEW.health != COALESCE((NEW.stats_data->>'health')::integer, 100) OR
     NEW.max_health != COALESCE((NEW.stats_data->>'max_health')::integer, 100) THEN
    
    NEW.stats_data = jsonb_build_object(
      'gold', NEW.gold,
      'experience', NEW.experience,
      'level', NEW.level,
      'health', NEW.health,
      'max_health', NEW.max_health,
      'character_name', NEW.character_name
    );
  END IF;
  
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger to automatically sync data
DROP TRIGGER IF EXISTS character_stats_sync_trigger ON character_stats;
CREATE TRIGGER character_stats_sync_trigger
  BEFORE INSERT OR UPDATE ON character_stats
  FOR EACH ROW
  EXECUTE FUNCTION sync_character_stats();

-- 6. Verify the final structure
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

-- 7. Show the unified view
SELECT * FROM character_stats_unified LIMIT 5;
