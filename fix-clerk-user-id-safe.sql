-- Safe migration for Clerk user ID compatibility
-- Only modifies tables that actually exist in your database

-- First, let's see what tables exist
DO $$
DECLARE
    tbl_name TEXT;
    tables_found TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Check which tables actually exist
    FOR tbl_name IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('character_stats', 'inventory_items', 'user_preferences', 'achievements', 'realm_grids', 'tile_inventory')
    LOOP
        tables_found := array_append(tables_found, tbl_name);
        RAISE NOTICE 'Found table: %', tbl_name;
    END LOOP;
    
    IF array_length(tables_found, 1) = 0 THEN
        RAISE NOTICE 'No target tables found in database';
    END IF;
END $$;

-- Step 1: Drop policies for character_stats (if table exists)
DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'character_stats' AND table_schema = 'public') THEN
        DROP POLICY IF EXISTS "Users can view own character stats" ON character_stats;
        DROP POLICY IF EXISTS "Users can insert own character stats" ON character_stats;
        DROP POLICY IF EXISTS "Users can update own character stats" ON character_stats;
        DROP POLICY IF EXISTS "Users can delete own character stats" ON character_stats;
        DROP POLICY IF EXISTS "Users can view their own character_stats data" ON character_stats;
        DROP POLICY IF EXISTS "Users can insert their own character_stats data" ON character_stats;
        DROP POLICY IF EXISTS "Users can update their own character_stats data" ON character_stats;
        DROP POLICY IF EXISTS "Users can delete their own character_stats data" ON character_stats;
        RAISE NOTICE 'Dropped policies for character_stats';
    ELSE
        RAISE NOTICE 'Table character_stats does not exist, skipping';
    END IF;
END $$;

-- Step 2: Drop policies for inventory_items (if table exists)
DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'inventory_items' AND table_schema = 'public') THEN
        DROP POLICY IF EXISTS "Users can view own inventory" ON inventory_items;
        DROP POLICY IF EXISTS "Users can insert own inventory items" ON inventory_items;
        DROP POLICY IF EXISTS "Users can update own inventory items" ON inventory_items;
        DROP POLICY IF EXISTS "Users can delete own inventory items" ON inventory_items;
        RAISE NOTICE 'Dropped policies for inventory_items';
    ELSE
        RAISE NOTICE 'Table inventory_items does not exist, skipping';
    END IF;
END $$;

-- Step 3: Drop policies for user_preferences (if table exists)
DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_preferences' AND table_schema = 'public') THEN
        DROP POLICY IF EXISTS "Users can view own preferences" ON user_preferences;
        DROP POLICY IF EXISTS "Users can insert own preferences" ON user_preferences;
        DROP POLICY IF EXISTS "Users can update own preferences" ON user_preferences;
        DROP POLICY IF EXISTS "Users can delete own preferences" ON user_preferences;
        RAISE NOTICE 'Dropped policies for user_preferences';
    ELSE
        RAISE NOTICE 'Table user_preferences does not exist, skipping';
    END IF;
END $$;

-- Step 4: Drop policies for achievements (if table exists)
DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'achievements' AND table_schema = 'public') THEN
        DROP POLICY IF EXISTS "Users can view own achievements" ON achievements;
        DROP POLICY IF EXISTS "Users can insert own achievements" ON achievements;
        DROP POLICY IF EXISTS "Users can update own achievements" ON achievements;
        DROP POLICY IF EXISTS "Users can delete own achievements" ON achievements;
        RAISE NOTICE 'Dropped policies for achievements';
    ELSE
        RAISE NOTICE 'Table achievements does not exist, skipping';
    END IF;
END $$;

-- Step 5: Drop policies for realm_grids (if table exists)
DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'realm_grids' AND table_schema = 'public') THEN
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
        RAISE NOTICE 'Dropped policies for realm_grids';
    ELSE
        RAISE NOTICE 'Table realm_grids does not exist, skipping';
    END IF;
END $$;

-- Step 6: Drop policies for tile_inventory (if table exists)
DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tile_inventory' AND table_schema = 'public') THEN
        DROP POLICY IF EXISTS "Users can view own tile inventory" ON tile_inventory;
        DROP POLICY IF EXISTS "Users can insert own tile inventory" ON tile_inventory;
        DROP POLICY IF EXISTS "Users can update own tile inventory" ON tile_inventory;
        DROP POLICY IF EXISTS "Users can delete own tile inventory" ON tile_inventory;
        RAISE NOTICE 'Dropped policies for tile_inventory';
    ELSE
        RAISE NOTICE 'Table tile_inventory does not exist, skipping';
    END IF;
END $$;

-- Step 7: Change user_id columns from UUID to TEXT (only for existing tables)
DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'character_stats' AND table_schema = 'public') THEN
        ALTER TABLE character_stats ALTER COLUMN user_id TYPE TEXT;
        RAISE NOTICE 'Changed character_stats.user_id to TEXT';
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'inventory_items' AND table_schema = 'public') THEN
        ALTER TABLE inventory_items ALTER COLUMN user_id TYPE TEXT;
        RAISE NOTICE 'Changed inventory_items.user_id to TEXT';
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_preferences' AND table_schema = 'public') THEN
        ALTER TABLE user_preferences ALTER COLUMN user_id TYPE TEXT;
        RAISE NOTICE 'Changed user_preferences.user_id to TEXT';
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'achievements' AND table_schema = 'public') THEN
        ALTER TABLE achievements ALTER COLUMN user_id TYPE TEXT;
        RAISE NOTICE 'Changed achievements.user_id to TEXT';
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'realm_grids' AND table_schema = 'public') THEN
        ALTER TABLE realm_grids ALTER COLUMN user_id TYPE TEXT;
        RAISE NOTICE 'Changed realm_grids.user_id to TEXT';
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tile_inventory' AND table_schema = 'public') THEN
        ALTER TABLE tile_inventory ALTER COLUMN user_id TYPE TEXT;
        RAISE NOTICE 'Changed tile_inventory.user_id to TEXT';
    END IF;
END $$;

-- Step 8: Recreate RLS policies (only for existing tables)
DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'character_stats' AND table_schema = 'public') THEN
        CREATE POLICY "Users can view own character stats" ON character_stats
          FOR SELECT USING (user_id = auth.get_user_id());
        CREATE POLICY "Users can insert own character stats" ON character_stats
          FOR INSERT WITH CHECK (user_id = auth.get_user_id());
        CREATE POLICY "Users can update own character stats" ON character_stats
          FOR UPDATE USING (user_id = auth.get_user_id());
        CREATE POLICY "Users can delete own character stats" ON character_stats
          FOR DELETE USING (user_id = auth.get_user_id());
        ALTER TABLE character_stats ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Recreated policies for character_stats';
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'inventory_items' AND table_schema = 'public') THEN
        CREATE POLICY "Users can view own inventory" ON inventory_items
          FOR SELECT USING (user_id = auth.get_user_id());
        CREATE POLICY "Users can insert own inventory items" ON inventory_items
          FOR INSERT WITH CHECK (user_id = auth.get_user_id());
        CREATE POLICY "Users can update own inventory items" ON inventory_items
          FOR UPDATE USING (user_id = auth.get_user_id());
        CREATE POLICY "Users can delete own inventory items" ON inventory_items
          FOR DELETE USING (user_id = auth.get_user_id());
        ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Recreated policies for inventory_items';
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_preferences' AND table_schema = 'public') THEN
        CREATE POLICY "Users can view own preferences" ON user_preferences
          FOR SELECT USING (user_id = auth.get_user_id());
        CREATE POLICY "Users can insert own preferences" ON user_preferences
          FOR INSERT WITH CHECK (user_id = auth.get_user_id());
        CREATE POLICY "Users can update own preferences" ON user_preferences
          FOR UPDATE USING (user_id = auth.get_user_id());
        CREATE POLICY "Users can delete own preferences" ON user_preferences
          FOR DELETE USING (user_id = auth.get_user_id());
        ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Recreated policies for user_preferences';
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'achievements' AND table_schema = 'public') THEN
        CREATE POLICY "Users can view own achievements" ON achievements
          FOR SELECT USING (user_id = auth.get_user_id());
        CREATE POLICY "Users can insert own achievements" ON achievements
          FOR INSERT WITH CHECK (user_id = auth.get_user_id());
        CREATE POLICY "Users can update own achievements" ON achievements
          FOR UPDATE USING (user_id = auth.get_user_id());
        CREATE POLICY "Users can delete own achievements" ON achievements
          FOR DELETE USING (user_id = auth.get_user_id());
        ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Recreated policies for achievements';
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'realm_grids' AND table_schema = 'public') THEN
        CREATE POLICY "Users can view their own grids" ON realm_grids
          FOR SELECT USING (user_id = auth.get_user_id());
        CREATE POLICY "Users can insert their own grids" ON realm_grids
          FOR INSERT WITH CHECK (user_id = auth.get_user_id());
        CREATE POLICY "Users can update their own grids" ON realm_grids
          FOR UPDATE USING (user_id = auth.get_user_id())
          WITH CHECK (user_id = auth.get_user_id());
        CREATE POLICY "Users can delete their own grids" ON realm_grids
          FOR DELETE USING (user_id = auth.get_user_id());
        ALTER TABLE realm_grids ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Recreated policies for realm_grids';
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tile_inventory' AND table_schema = 'public') THEN
        CREATE POLICY "Users can view own tile inventory" ON tile_inventory
          FOR SELECT USING (user_id = auth.get_user_id());
        CREATE POLICY "Users can insert own tile inventory" ON tile_inventory
          FOR INSERT WITH CHECK (user_id = auth.get_user_id());
        CREATE POLICY "Users can update own tile inventory" ON tile_inventory
          FOR UPDATE USING (user_id = auth.get_user_id());
        CREATE POLICY "Users can delete own tile inventory" ON tile_inventory
          FOR DELETE USING (user_id = auth.get_user_id());
        ALTER TABLE tile_inventory ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Recreated policies for tile_inventory';
    END IF;
END $$;

-- Final confirmation
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully! All existing tables have been updated.';
END $$; 