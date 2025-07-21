-- Migration: Fix user_id columns from UUID to TEXT for Clerk compatibility
-- Clerk user IDs are strings like "user_2z5XXhrBfLdbU0P6AUCBco0CJWC", not UUIDs
-- This migration updates all tables to use TEXT for user_id columns

-- Step 1: Drop all RLS policies that depend on user_id columns
-- We need to drop policies before changing column types

-- Drop policies for character_stats
DROP POLICY IF EXISTS "Users can view own character stats" ON character_stats;
DROP POLICY IF EXISTS "Users can insert own character stats" ON character_stats;
DROP POLICY IF EXISTS "Users can update own character stats" ON character_stats;
DROP POLICY IF EXISTS "Users can delete own character stats" ON character_stats;
DROP POLICY IF EXISTS "Users can view their own character_stats data" ON character_stats;
DROP POLICY IF EXISTS "Users can insert their own character_stats data" ON character_stats;
DROP POLICY IF EXISTS "Users can update their own character_stats data" ON character_stats;
DROP POLICY IF EXISTS "Users can delete their own character_stats data" ON character_stats;

-- Drop policies for inventory_items
DROP POLICY IF EXISTS "Users can view own inventory" ON inventory_items;
DROP POLICY IF EXISTS "Users can insert own inventory items" ON inventory_items;
DROP POLICY IF EXISTS "Users can update own inventory items" ON inventory_items;
DROP POLICY IF EXISTS "Users can delete own inventory items" ON inventory_items;

-- Drop policies for user_preferences
DROP POLICY IF EXISTS "Users can view own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can delete own preferences" ON user_preferences;

-- Drop policies for achievements
DROP POLICY IF EXISTS "Users can view own achievements" ON achievements;
DROP POLICY IF EXISTS "Users can insert own achievements" ON achievements;
DROP POLICY IF EXISTS "Users can update own achievements" ON achievements;
DROP POLICY IF EXISTS "Users can delete own achievements" ON achievements;

-- Drop policies for realm_grids
DROP POLICY IF EXISTS "Users can view own realm grids" ON realm_grids;
DROP POLICY IF EXISTS "Users can insert own realm grids" ON realm_grids;
DROP POLICY IF EXISTS "Users can update own realm grids" ON realm_grids;
DROP POLICY IF EXISTS "Users can delete own realm grids" ON realm_grids;
DROP POLICY IF EXISTS "Users can view their own grids" ON realm_grids;
DROP POLICY IF EXISTS "Users can insert their own grids" ON realm_grids;
DROP POLICY IF EXISTS "Users can update their own grids" ON realm_grids;
DROP POLICY IF EXISTS "Users can delete their own grids" ON realm_grids;
DROP POLICY IF EXISTS "Anyone can view public grids" ON realm_grids;
DROP POLICY IF EXISTS "Allow anonymous table check" ON realm_grids;

-- Drop policies for tile_inventory
DROP POLICY IF EXISTS "Users can view own tile inventory" ON tile_inventory;
DROP POLICY IF EXISTS "Users can insert own tile inventory" ON tile_inventory;
DROP POLICY IF EXISTS "Users can update own tile inventory" ON tile_inventory;
DROP POLICY IF EXISTS "Users can delete own tile inventory" ON tile_inventory;

-- Drop policies for other tables if they exist
DO $$ 
DECLARE 
    r RECORD;
BEGIN 
    FOR r IN SELECT schemaname, tablename, policyname FROM pg_policies 
             WHERE schemaname = 'public' 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.schemaname || '.' || r.tablename;
    END LOOP;
END $$;

-- Update character_stats table
ALTER TABLE character_stats ALTER COLUMN user_id TYPE TEXT;

-- Update inventory_items table  
ALTER TABLE inventory_items ALTER COLUMN user_id TYPE TEXT;

-- Update character_perks table (if exists)
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'character_perks') THEN
    ALTER TABLE character_perks ALTER COLUMN user_id TYPE TEXT;
  END IF;
END $$;

-- Update character_titles table (if exists)
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'character_titles') THEN
    ALTER TABLE character_titles ALTER COLUMN user_id TYPE TEXT;
  END IF;
END $$;

-- Update character_strengths table (if exists)
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'character_strengths') THEN
    ALTER TABLE character_strengths ALTER COLUMN user_id TYPE TEXT;
  END IF;
END $$;

-- Update achievements table
ALTER TABLE achievements ALTER COLUMN user_id TYPE TEXT;

-- Update notifications table (if exists)
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications') THEN
    ALTER TABLE notifications ALTER COLUMN user_id TYPE TEXT;
  END IF;
END $$;

-- Update app_logs table (if exists)
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'app_logs') THEN
    ALTER TABLE app_logs ALTER COLUMN user_id TYPE TEXT;
  END IF;
END $$;

-- Update kingdom_time_series table (if exists)
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'kingdom_time_series') THEN
    ALTER TABLE kingdom_time_series ALTER COLUMN user_id TYPE TEXT;
  END IF;
END $$;

-- Update tile_inventory table
ALTER TABLE tile_inventory ALTER COLUMN user_id TYPE TEXT;

-- Update discoveries table (if exists)
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'discoveries') THEN
    ALTER TABLE discoveries ALTER COLUMN user_id TYPE TEXT;
  END IF;
END $$;

-- Update quest_stats table (if exists)
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'quest_stats') THEN
    ALTER TABLE quest_stats ALTER COLUMN user_id TYPE TEXT;
  END IF;
END $$;

-- Update image_descriptions table (if exists)
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'image_descriptions') THEN
    ALTER TABLE image_descriptions ALTER COLUMN user_id TYPE TEXT;
  END IF;
END $$;

-- Update game_settings table (if exists)
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'game_settings') THEN
    ALTER TABLE game_settings ALTER COLUMN user_id TYPE TEXT;
  END IF;
END $$;

-- Update purchased_items table (if exists)
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'purchased_items') THEN
    ALTER TABLE purchased_items ALTER COLUMN user_id TYPE TEXT;
  END IF;
END $$;

-- Update notable_locations table (if exists)
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notable_locations') THEN
    ALTER TABLE notable_locations ALTER COLUMN user_id TYPE TEXT;
  END IF;
END $$;

-- Update milestones table (if exists)
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'milestones') THEN
    ALTER TABLE milestones ALTER COLUMN user_id TYPE TEXT;
  END IF;
END $$;

-- Update checked_milestones table (if exists)
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'checked_milestones') THEN
    ALTER TABLE checked_milestones ALTER COLUMN user_id TYPE TEXT;
  END IF;
END $$;

-- Update checked_quests table (if exists)
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'checked_quests') THEN
    ALTER TABLE checked_quests ALTER COLUMN user_id TYPE TEXT;
  END IF;
END $$;

-- Update tile_counts table (if exists)
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tile_counts') THEN
    ALTER TABLE tile_counts ALTER COLUMN user_id TYPE TEXT;
  END IF;
END $$;

-- Update tilemap table (if exists)
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tilemap') THEN
    ALTER TABLE tilemap ALTER COLUMN user_id TYPE TEXT;
  END IF;
END $$;

-- Update user_preferences table
ALTER TABLE user_preferences ALTER COLUMN user_id TYPE TEXT;

-- Update realm_visits table (if exists)
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'realm_visits') THEN
    ALTER TABLE realm_visits ALTER COLUMN user_id TYPE TEXT;
  END IF;
END $$;

-- Update dungeon_sessions table (if exists)
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'dungeon_sessions') THEN
    ALTER TABLE dungeon_sessions ALTER COLUMN user_id TYPE TEXT;
  END IF;
END $$;

-- Update character_positions table (if exists)
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'character_positions') THEN
    ALTER TABLE character_positions ALTER COLUMN user_id TYPE TEXT;
  END IF;
END $$;

-- Update gold_transactions table (if exists)
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'gold_transactions') THEN
    ALTER TABLE gold_transactions ALTER COLUMN user_id TYPE TEXT;
  END IF;
END $$;

-- Update experience_transactions table (if exists)
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'experience_transactions') THEN
    ALTER TABLE experience_transactions ALTER COLUMN user_id TYPE TEXT;
  END IF;
END $$;

-- Update user_sessions table (if exists)
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_sessions') THEN
    ALTER TABLE user_sessions ALTER COLUMN user_id TYPE TEXT;
  END IF;
END $$;

-- Update realm_grid_data table (if exists)
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'realm_grid_data') THEN
    ALTER TABLE realm_grid_data ALTER COLUMN user_id TYPE TEXT;
  END IF;
END $$;

-- Update realm_grids table
ALTER TABLE realm_grids ALTER COLUMN user_id TYPE TEXT;

-- Update quest_completion table (if exists)
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'quest_completion') THEN
    ALTER TABLE quest_completion ALTER COLUMN user_id TYPE TEXT;
  END IF;
END $$;

-- Update challenge_completion table (if exists)
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'challenge_completion') THEN
    ALTER TABLE challenge_completion ALTER COLUMN user_id TYPE TEXT;
  END IF;
END $$;

-- Update streaks table (if exists)
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'streaks') THEN
    ALTER TABLE streaks ALTER COLUMN user_id TYPE TEXT;
  END IF;
END $$;

-- Update realm_map table (if exists)
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'realm_map') THEN
    ALTER TABLE realm_map ALTER COLUMN user_id TYPE TEXT;
  END IF;
END $$;

-- Step 3: Recreate RLS policies with TEXT user_id columns

-- Recreate policies for character_stats table
CREATE POLICY "Users can view own character stats" ON character_stats
  FOR SELECT USING (user_id = auth.get_user_id());

CREATE POLICY "Users can insert own character stats" ON character_stats
  FOR INSERT WITH CHECK (user_id = auth.get_user_id());

CREATE POLICY "Users can update own character stats" ON character_stats
  FOR UPDATE USING (user_id = auth.get_user_id());

CREATE POLICY "Users can delete own character stats" ON character_stats
  FOR DELETE USING (user_id = auth.get_user_id());

-- Recreate policies for inventory_items table
CREATE POLICY "Users can view own inventory" ON inventory_items
  FOR SELECT USING (user_id = auth.get_user_id());

CREATE POLICY "Users can insert own inventory items" ON inventory_items
  FOR INSERT WITH CHECK (user_id = auth.get_user_id());

CREATE POLICY "Users can update own inventory items" ON inventory_items
  FOR UPDATE USING (user_id = auth.get_user_id());

CREATE POLICY "Users can delete own inventory items" ON inventory_items
  FOR DELETE USING (user_id = auth.get_user_id());

-- Recreate policies for user_preferences table
CREATE POLICY "Users can view own preferences" ON user_preferences
  FOR SELECT USING (user_id = auth.get_user_id());

CREATE POLICY "Users can insert own preferences" ON user_preferences
  FOR INSERT WITH CHECK (user_id = auth.get_user_id());

CREATE POLICY "Users can update own preferences" ON user_preferences
  FOR UPDATE USING (user_id = auth.get_user_id());

CREATE POLICY "Users can delete own preferences" ON user_preferences
  FOR DELETE USING (user_id = auth.get_user_id());

-- Recreate policies for achievements table
CREATE POLICY "Users can view own achievements" ON achievements
  FOR SELECT USING (user_id = auth.get_user_id());

CREATE POLICY "Users can insert own achievements" ON achievements
  FOR INSERT WITH CHECK (user_id = auth.get_user_id());

CREATE POLICY "Users can update own achievements" ON achievements
  FOR UPDATE USING (user_id = auth.get_user_id());

CREATE POLICY "Users can delete own achievements" ON achievements
  FOR DELETE USING (user_id = auth.get_user_id());

-- Recreate policies for realm_grids table
CREATE POLICY "Users can view their own grids" ON realm_grids
  FOR SELECT USING (user_id = auth.get_user_id());

CREATE POLICY "Anyone can view public grids" ON realm_grids
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can insert their own grids" ON realm_grids
  FOR INSERT WITH CHECK (user_id = auth.get_user_id());

CREATE POLICY "Users can update their own grids" ON realm_grids
  FOR UPDATE USING (user_id = auth.get_user_id())
  WITH CHECK (user_id = auth.get_user_id());

CREATE POLICY "Users can delete their own grids" ON realm_grids
  FOR DELETE USING (user_id = auth.get_user_id());

-- Recreate policies for tile_inventory table
CREATE POLICY "Users can view own tile inventory" ON tile_inventory
  FOR SELECT USING (user_id = auth.get_user_id());

CREATE POLICY "Users can insert own tile inventory" ON tile_inventory
  FOR INSERT WITH CHECK (user_id = auth.get_user_id());

CREATE POLICY "Users can update own tile inventory" ON tile_inventory
  FOR UPDATE USING (user_id = auth.get_user_id());

CREATE POLICY "Users can delete own tile inventory" ON tile_inventory
  FOR DELETE USING (user_id = auth.get_user_id());

-- Ensure RLS is enabled on all tables
ALTER TABLE character_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE realm_grids ENABLE ROW LEVEL SECURITY;
ALTER TABLE tile_inventory ENABLE ROW LEVEL SECURITY; 