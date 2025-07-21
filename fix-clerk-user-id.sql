-- Quick fix for Clerk user ID compatibility
-- Run this in your Supabase SQL Editor

-- Step 1: Drop RLS policies that prevent column type changes
DROP POLICY IF EXISTS "Users can view own character stats" ON character_stats;
DROP POLICY IF EXISTS "Users can insert own character stats" ON character_stats;
DROP POLICY IF EXISTS "Users can update own character stats" ON character_stats;
DROP POLICY IF EXISTS "Users can delete own character stats" ON character_stats;
DROP POLICY IF EXISTS "Users can view their own character_stats data" ON character_stats;
DROP POLICY IF EXISTS "Users can insert their own character_stats data" ON character_stats;
DROP POLICY IF EXISTS "Users can update their own character_stats data" ON character_stats;
DROP POLICY IF EXISTS "Users can delete their own character_stats data" ON character_stats;

DROP POLICY IF EXISTS "Users can view own inventory" ON inventory_items;
DROP POLICY IF EXISTS "Users can insert own inventory items" ON inventory_items;
DROP POLICY IF EXISTS "Users can update own inventory items" ON inventory_items;
DROP POLICY IF EXISTS "Users can delete own inventory items" ON inventory_items;

DROP POLICY IF EXISTS "Users can view own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can delete own preferences" ON user_preferences;

DROP POLICY IF EXISTS "Users can view own achievements" ON achievements;
DROP POLICY IF EXISTS "Users can insert own achievements" ON achievements;
DROP POLICY IF EXISTS "Users can update own achievements" ON achievements;
DROP POLICY IF EXISTS "Users can delete own achievements" ON achievements;

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

DROP POLICY IF EXISTS "Users can view own tile inventory" ON tile_inventory;
DROP POLICY IF EXISTS "Users can insert own tile inventory" ON tile_inventory;
DROP POLICY IF EXISTS "Users can update own tile inventory" ON tile_inventory;
DROP POLICY IF EXISTS "Users can delete own tile inventory" ON tile_inventory;

-- Step 2: Change user_id columns from UUID to TEXT
ALTER TABLE character_stats ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE inventory_items ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE user_preferences ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE achievements ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE realm_grids ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE tile_inventory ALTER COLUMN user_id TYPE TEXT;

-- Step 3: Recreate RLS policies
CREATE POLICY "Users can view own character stats" ON character_stats
  FOR SELECT USING (user_id = auth.get_user_id());

CREATE POLICY "Users can insert own character stats" ON character_stats
  FOR INSERT WITH CHECK (user_id = auth.get_user_id());

CREATE POLICY "Users can update own character stats" ON character_stats
  FOR UPDATE USING (user_id = auth.get_user_id());

CREATE POLICY "Users can delete own character stats" ON character_stats
  FOR DELETE USING (user_id = auth.get_user_id());

CREATE POLICY "Users can view own inventory" ON inventory_items
  FOR SELECT USING (user_id = auth.get_user_id());

CREATE POLICY "Users can insert own inventory items" ON inventory_items
  FOR INSERT WITH CHECK (user_id = auth.get_user_id());

CREATE POLICY "Users can update own inventory items" ON inventory_items
  FOR UPDATE USING (user_id = auth.get_user_id());

CREATE POLICY "Users can delete own inventory items" ON inventory_items
  FOR DELETE USING (user_id = auth.get_user_id());

CREATE POLICY "Users can view own preferences" ON user_preferences
  FOR SELECT USING (user_id = auth.get_user_id());

CREATE POLICY "Users can insert own preferences" ON user_preferences
  FOR INSERT WITH CHECK (user_id = auth.get_user_id());

CREATE POLICY "Users can update own preferences" ON user_preferences
  FOR UPDATE USING (user_id = auth.get_user_id());

CREATE POLICY "Users can delete own preferences" ON user_preferences
  FOR DELETE USING (user_id = auth.get_user_id());

CREATE POLICY "Users can view own achievements" ON achievements
  FOR SELECT USING (user_id = auth.get_user_id());

CREATE POLICY "Users can insert own achievements" ON achievements
  FOR INSERT WITH CHECK (user_id = auth.get_user_id());

CREATE POLICY "Users can update own achievements" ON achievements
  FOR UPDATE USING (user_id = auth.get_user_id());

CREATE POLICY "Users can delete own achievements" ON achievements
  FOR DELETE USING (user_id = auth.get_user_id());

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

CREATE POLICY "Users can view own tile inventory" ON tile_inventory
  FOR SELECT USING (user_id = auth.get_user_id());

CREATE POLICY "Users can insert own tile inventory" ON tile_inventory
  FOR INSERT WITH CHECK (user_id = auth.get_user_id());

CREATE POLICY "Users can update own tile inventory" ON tile_inventory
  FOR UPDATE USING (user_id = auth.get_user_id());

CREATE POLICY "Users can delete own tile inventory" ON tile_inventory
  FOR DELETE USING (user_id = auth.get_user_id());

-- Ensure RLS is enabled
ALTER TABLE character_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE realm_grids ENABLE ROW LEVEL SECURITY;
ALTER TABLE tile_inventory ENABLE ROW LEVEL SECURITY; 