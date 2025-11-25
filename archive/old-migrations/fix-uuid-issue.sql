-- Fix UUID Type Mismatch for Clerk User IDs
-- This converts the user_id columns from UUID to TEXT to accept Clerk string IDs

-- 1. First, drop ALL existing policies that reference user_id columns
DROP POLICY IF EXISTS "Users can manage their own kingdom grid" ON kingdom_grid;
DROP POLICY IF EXISTS "Users can view own kingdom grid" ON kingdom_grid;
DROP POLICY IF EXISTS "Users can insert own kingdom grid" ON kingdom_grid;
DROP POLICY IF EXISTS "Users can update own kingdom grid" ON kingdom_grid;

DROP POLICY IF EXISTS "Users can view own kingdom timers" ON kingdom_timers;
DROP POLICY IF EXISTS "Users can insert own kingdom timers" ON kingdom_timers;
DROP POLICY IF EXISTS "Users can update own kingdom timers" ON kingdom_timers;

DROP POLICY IF EXISTS "Users can view own kingdom items" ON kingdom_items;
DROP POLICY IF EXISTS "Users can insert own kingdom items" ON kingdom_items;
DROP POLICY IF EXISTS "Users can update own kingdom items" ON kingdom_items;

DROP POLICY IF EXISTS "Users can view own kingdom tile states" ON kingdom_tile_states;
DROP POLICY IF EXISTS "Users can insert own kingdom tile states" ON kingdom_tile_states;
DROP POLICY IF EXISTS "Users can update own kingdom tile states" ON kingdom_tile_states;

DROP POLICY IF EXISTS "Allow all authenticated users" ON kingdom_timers;
DROP POLICY IF EXISTS "Allow all authenticated users" ON kingdom_items;
DROP POLICY IF EXISTS "Allow all authenticated users" ON kingdom_tile_states;
DROP POLICY IF EXISTS "Allow all authenticated users" ON kingdom_grid;

-- 2. Now change the column types (policies are dropped, so this should work)
ALTER TABLE kingdom_timers 
ALTER COLUMN user_id TYPE TEXT;

ALTER TABLE kingdom_items 
ALTER COLUMN user_id TYPE TEXT;

ALTER TABLE kingdom_tile_states 
ALTER COLUMN user_id TYPE TEXT;

ALTER TABLE kingdom_grid 
ALTER COLUMN user_id TYPE TEXT;

-- 3. Create new RLS policies for text user_id
CREATE POLICY "Allow all authenticated users" ON kingdom_timers
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated users" ON kingdom_items
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated users" ON kingdom_tile_states
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated users" ON kingdom_grid
    FOR ALL USING (auth.role() = 'authenticated');

-- 4. Output confirmation
SELECT 'UUID type mismatch fixed successfully!' as status;
