-- Row Level Security (RLS) Policies for Clerk Authentication
-- This migration sets up secure data access using Supabase's free plan features
-- Compatible with the authentication flow: Frontend → Backend (Clerk JWT) → Supabase (Service Key)

-- Enable RLS on all user data tables
ALTER TABLE character_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE quest_completion ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_completion ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE realm_grids ENABLE ROW LEVEL SECURITY;
ALTER TABLE tile_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE realm_map ENABLE ROW LEVEL SECURITY;

-- Create a function to get the current user ID from JWT
-- This works with both service role and authenticated users
CREATE OR REPLACE FUNCTION auth.get_user_id()
RETURNS TEXT AS $$
BEGIN
  -- For service role queries (our API routes), return the user_id parameter
  -- For direct client queries, return the JWT user_id
  RETURN COALESCE(
    current_setting('request.jwt.claims', true)::json->>'sub',
    current_setting('app.current_user_id', true)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create policies for character_stats table
CREATE POLICY "Users can view own character stats" ON character_stats
  FOR SELECT USING (user_id = auth.get_user_id());

CREATE POLICY "Users can insert own character stats" ON character_stats
  FOR INSERT WITH CHECK (user_id = auth.get_user_id());

CREATE POLICY "Users can update own character stats" ON character_stats
  FOR UPDATE USING (user_id = auth.get_user_id());

CREATE POLICY "Users can delete own character stats" ON character_stats
  FOR DELETE USING (user_id = auth.get_user_id());

-- Create policies for inventory_items table
CREATE POLICY "Users can view own inventory" ON inventory_items
  FOR SELECT USING (user_id = auth.get_user_id());

CREATE POLICY "Users can insert own inventory items" ON inventory_items
  FOR INSERT WITH CHECK (user_id = auth.get_user_id());

CREATE POLICY "Users can update own inventory items" ON inventory_items
  FOR UPDATE USING (user_id = auth.get_user_id());

CREATE POLICY "Users can delete own inventory items" ON inventory_items
  FOR DELETE USING (user_id = auth.get_user_id());

-- Create policies for user_preferences table
CREATE POLICY "Users can view own preferences" ON user_preferences
  FOR SELECT USING (user_id = auth.get_user_id());

CREATE POLICY "Users can insert own preferences" ON user_preferences
  FOR INSERT WITH CHECK (user_id = auth.get_user_id());

CREATE POLICY "Users can update own preferences" ON user_preferences
  FOR UPDATE USING (user_id = auth.get_user_id());

CREATE POLICY "Users can delete own preferences" ON user_preferences
  FOR DELETE USING (user_id = auth.get_user_id());

-- Create policies for quest_completion table
CREATE POLICY "Users can view own quest completions" ON quest_completion
  FOR SELECT USING (user_id = auth.get_user_id());

CREATE POLICY "Users can insert own quest completions" ON quest_completion
  FOR INSERT WITH CHECK (user_id = auth.get_user_id());

CREATE POLICY "Users can update own quest completions" ON quest_completion
  FOR UPDATE USING (user_id = auth.get_user_id());

CREATE POLICY "Users can delete own quest completions" ON quest_completion
  FOR DELETE USING (user_id = auth.get_user_id());

-- Create policies for challenge_completion table
CREATE POLICY "Users can view own challenge completions" ON challenge_completion
  FOR SELECT USING (user_id = auth.get_user_id());

CREATE POLICY "Users can insert own challenge completions" ON challenge_completion
  FOR INSERT WITH CHECK (user_id = auth.get_user_id());

CREATE POLICY "Users can update own challenge completions" ON challenge_completion
  FOR UPDATE USING (user_id = auth.get_user_id());

CREATE POLICY "Users can delete own challenge completions" ON challenge_completion
  FOR DELETE USING (user_id = auth.get_user_id());

-- Create policies for streaks table
CREATE POLICY "Users can view own streaks" ON streaks
  FOR SELECT USING (user_id = auth.get_user_id());

CREATE POLICY "Users can insert own streaks" ON streaks
  FOR INSERT WITH CHECK (user_id = auth.get_user_id());

CREATE POLICY "Users can update own streaks" ON streaks
  FOR UPDATE USING (user_id = auth.get_user_id());

CREATE POLICY "Users can delete own streaks" ON streaks
  FOR DELETE USING (user_id = auth.get_user_id());

-- Create policies for achievements table
CREATE POLICY "Users can view own achievements" ON achievements
  FOR SELECT USING (user_id = auth.get_user_id());

CREATE POLICY "Users can insert own achievements" ON achievements
  FOR INSERT WITH CHECK (user_id = auth.get_user_id());

CREATE POLICY "Users can update own achievements" ON achievements
  FOR UPDATE USING (user_id = auth.get_user_id());

CREATE POLICY "Users can delete own achievements" ON achievements
  FOR DELETE USING (user_id = auth.get_user_id());

-- Create policies for realm_grids table
CREATE POLICY "Users can view own realm grids" ON realm_grids
  FOR SELECT USING (user_id = auth.get_user_id());

CREATE POLICY "Users can insert own realm grids" ON realm_grids
  FOR INSERT WITH CHECK (user_id = auth.get_user_id());

CREATE POLICY "Users can update own realm grids" ON realm_grids
  FOR UPDATE USING (user_id = auth.get_user_id());

CREATE POLICY "Users can delete own realm grids" ON realm_grids
  FOR DELETE USING (user_id = auth.get_user_id());

-- Create policies for tile_inventory table
CREATE POLICY "Users can view own tile inventory" ON tile_inventory
  FOR SELECT USING (user_id = auth.get_user_id());

CREATE POLICY "Users can insert own tile inventory" ON tile_inventory
  FOR INSERT WITH CHECK (user_id = auth.get_user_id());

CREATE POLICY "Users can update own tile inventory" ON tile_inventory
  FOR UPDATE USING (user_id = auth.get_user_id());

CREATE POLICY "Users can delete own tile inventory" ON tile_inventory
  FOR DELETE USING (user_id = auth.get_user_id());

-- Create policies for realm_map table
CREATE POLICY "Users can view own realm map" ON realm_map
  FOR SELECT USING (user_id = auth.get_user_id());

CREATE POLICY "Users can insert own realm map" ON realm_map
  FOR INSERT WITH CHECK (user_id = auth.get_user_id());

CREATE POLICY "Users can update own realm map" ON realm_map
  FOR UPDATE USING (user_id = auth.get_user_id());

CREATE POLICY "Users can delete own realm map" ON realm_map
  FOR DELETE USING (user_id = auth.get_user_id());

-- Read-only tables that all authenticated users can access
-- These tables contain game data that doesn't belong to specific users

-- Quests table (read-only for all users)
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All authenticated users can view quests" ON quests
  FOR SELECT USING (auth.get_user_id() IS NOT NULL);

-- Challenges table (read-only for all users)  
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All authenticated users can view challenges" ON challenges
  FOR SELECT USING (auth.get_user_id() IS NOT NULL);

-- Milestones table (read-only for all users)
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All authenticated users can view milestones" ON milestones
  FOR SELECT USING (auth.get_user_id() IS NOT NULL);

-- Helper function for API routes to set the current user context
-- This allows our service role queries to respect RLS policies
CREATE OR REPLACE FUNCTION set_user_context(user_id TEXT)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_user_id', user_id, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions to the service role
GRANT EXECUTE ON FUNCTION auth.get_user_id() TO service_role;
GRANT EXECUTE ON FUNCTION set_user_context(TEXT) TO service_role;

-- Create an index on user_id columns for better performance
CREATE INDEX IF NOT EXISTS idx_character_stats_user_id ON character_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_user_id ON inventory_items(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_quest_completion_user_id ON quest_completion(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_completion_user_id ON challenge_completion(user_id);
CREATE INDEX IF NOT EXISTS idx_streaks_user_id ON streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_realm_grids_user_id ON realm_grids(user_id);
CREATE INDEX IF NOT EXISTS idx_tile_inventory_user_id ON tile_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_realm_map_user_id ON realm_map(user_id); 