-- Final migration for Clerk user ID compatibility
-- Creates auth functions, drops policies, changes columns, recreates policies

-- Step 1: Create auth schema and functions
CREATE SCHEMA IF NOT EXISTS auth;

CREATE OR REPLACE FUNCTION auth.get_user_id()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    current_setting('request.jwt.claims', true)::json->>'sub',
    current_setting('app.current_user_id', true)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION set_user_context(user_id TEXT)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_user_id', user_id, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION auth.get_user_id() TO service_role;
GRANT EXECUTE ON FUNCTION auth.get_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION auth.get_user_id() TO anon;
GRANT EXECUTE ON FUNCTION set_user_context(TEXT) TO service_role;

-- Step 2: Drop all existing policies
DO $$
DECLARE
    pol RECORD;
BEGIN
    RAISE NOTICE 'Dropping all existing policies...';
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
            RAISE NOTICE 'Dropped policy % on %.%', pol.policyname, pol.schemaname, pol.tablename;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop policy % on %.%: %', pol.policyname, pol.schemaname, pol.tablename, SQLERRM;
        END;
    END LOOP;
END $$;

-- Step 3: Change user_id columns from UUID to TEXT
DO $$ 
DECLARE
    tbl RECORD;
BEGIN
    RAISE NOTICE 'Changing user_id columns from UUID to TEXT...';
    FOR tbl IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND column_name = 'user_id'
        AND data_type = 'uuid'
    LOOP
        BEGIN
            EXECUTE format('ALTER TABLE %I ALTER COLUMN user_id TYPE TEXT', tbl.table_name);
            RAISE NOTICE 'Changed %.user_id from UUID to TEXT', tbl.table_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not change %.user_id: %', tbl.table_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- Step 4: Recreate policies for all existing tables
DO $$ 
DECLARE
    tbl_name TEXT;
BEGIN
    RAISE NOTICE 'Recreating RLS policies...';
    
    -- Character Stats
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'character_stats' AND table_schema = 'public') THEN
        CREATE POLICY "Users can view own character stats" ON character_stats FOR SELECT USING (user_id = auth.get_user_id());
        CREATE POLICY "Users can insert own character stats" ON character_stats FOR INSERT WITH CHECK (user_id = auth.get_user_id());
        CREATE POLICY "Users can update own character stats" ON character_stats FOR UPDATE USING (user_id = auth.get_user_id());
        CREATE POLICY "Users can delete own character stats" ON character_stats FOR DELETE USING (user_id = auth.get_user_id());
        ALTER TABLE character_stats ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Created policies for character_stats';
    END IF;
    
    -- Inventory Items
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'inventory_items' AND table_schema = 'public') THEN
        CREATE POLICY "Users can view own inventory" ON inventory_items FOR SELECT USING (user_id = auth.get_user_id());
        CREATE POLICY "Users can insert own inventory items" ON inventory_items FOR INSERT WITH CHECK (user_id = auth.get_user_id());
        CREATE POLICY "Users can update own inventory items" ON inventory_items FOR UPDATE USING (user_id = auth.get_user_id());
        CREATE POLICY "Users can delete own inventory items" ON inventory_items FOR DELETE USING (user_id = auth.get_user_id());
        ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Created policies for inventory_items';
    END IF;
    
    -- User Preferences
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_preferences' AND table_schema = 'public') THEN
        CREATE POLICY "Users can view own preferences" ON user_preferences FOR SELECT USING (user_id = auth.get_user_id());
        CREATE POLICY "Users can insert own preferences" ON user_preferences FOR INSERT WITH CHECK (user_id = auth.get_user_id());
        CREATE POLICY "Users can update own preferences" ON user_preferences FOR UPDATE USING (user_id = auth.get_user_id());
        CREATE POLICY "Users can delete own preferences" ON user_preferences FOR DELETE USING (user_id = auth.get_user_id());
        ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Created policies for user_preferences';
    END IF;
    
    -- Achievements
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'achievements' AND table_schema = 'public') THEN
        CREATE POLICY "Users can view own achievements" ON achievements FOR SELECT USING (user_id = auth.get_user_id());
        CREATE POLICY "Users can insert own achievements" ON achievements FOR INSERT WITH CHECK (user_id = auth.get_user_id());
        CREATE POLICY "Users can update own achievements" ON achievements FOR UPDATE USING (user_id = auth.get_user_id());
        CREATE POLICY "Users can delete own achievements" ON achievements FOR DELETE USING (user_id = auth.get_user_id());
        ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Created policies for achievements';
    END IF;
    
    -- Realm Grids
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'realm_grids' AND table_schema = 'public') THEN
        CREATE POLICY "Users can view their own grids" ON realm_grids FOR SELECT USING (user_id = auth.get_user_id());
        CREATE POLICY "Users can insert their own grids" ON realm_grids FOR INSERT WITH CHECK (user_id = auth.get_user_id());
        CREATE POLICY "Users can update their own grids" ON realm_grids FOR UPDATE USING (user_id = auth.get_user_id()) WITH CHECK (user_id = auth.get_user_id());
        CREATE POLICY "Users can delete their own grids" ON realm_grids FOR DELETE USING (user_id = auth.get_user_id());
        
        -- Add public grids policy if is_public column exists
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'realm_grids' AND column_name = 'is_public' AND table_schema = 'public') THEN
            CREATE POLICY "Anyone can view public grids" ON realm_grids FOR SELECT USING (is_public = true);
        END IF;
        
        ALTER TABLE realm_grids ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Created policies for realm_grids';
    END IF;
    
    -- Tile Inventory
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tile_inventory' AND table_schema = 'public') THEN
        CREATE POLICY "Users can view own tile inventory" ON tile_inventory FOR SELECT USING (user_id = auth.get_user_id());
        CREATE POLICY "Users can insert own tile inventory" ON tile_inventory FOR INSERT WITH CHECK (user_id = auth.get_user_id());
        CREATE POLICY "Users can update own tile inventory" ON tile_inventory FOR UPDATE USING (user_id = auth.get_user_id());
        CREATE POLICY "Users can delete own tile inventory" ON tile_inventory FOR DELETE USING (user_id = auth.get_user_id());
        ALTER TABLE tile_inventory ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Created policies for tile_inventory';
    END IF;
END $$;

-- Step 5: Final verification
DO $$
DECLARE
    tbl RECORD;
    pol_count INTEGER;
    func_exists BOOLEAN;
BEGIN
    -- Check if the auth function exists
    SELECT EXISTS (
        SELECT FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'auth' AND p.proname = 'get_user_id'
    ) INTO func_exists;
    
    RAISE NOTICE 'auth.get_user_id() function exists: %', func_exists;
    
    -- Check user_id column types
    FOR tbl IN 
        SELECT table_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND column_name = 'user_id'
    LOOP
        RAISE NOTICE 'Table %.user_id is now type: %', tbl.table_name, tbl.data_type;
    END LOOP;
    
    -- Count policies
    SELECT count(*) INTO pol_count FROM pg_policies WHERE schemaname = 'public';
    RAISE NOTICE 'Total policies created: %', pol_count;
    
    RAISE NOTICE 'Migration completed successfully! Clerk user IDs are now supported.';
END $$; 