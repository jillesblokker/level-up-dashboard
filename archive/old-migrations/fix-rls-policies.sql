-- Fix RLS Policies for Kingdom Tables
-- This should resolve the 500 errors

-- Step 1: Drop existing policies (if any)
DROP POLICY IF EXISTS "Users can view own kingdom timers" ON kingdom_timers;
DROP POLICY IF EXISTS "Users can insert own kingdom timers" ON kingdom_timers;
DROP POLICY IF EXISTS "Users can update own kingdom timers" ON kingdom_timers;

DROP POLICY IF EXISTS "Users can view own kingdom items" ON kingdom_items;
DROP POLICY IF EXISTS "Users can insert own kingdom items" ON kingdom_items;
DROP POLICY IF EXISTS "Users can update own kingdom items" ON kingdom_items;

DROP POLICY IF EXISTS "Users can view own kingdom tile states" ON kingdom_tile_states;
DROP POLICY IF EXISTS "Users can insert own kingdom tile states" ON kingdom_tile_states;
DROP POLICY IF EXISTS "Users can update own kingdom tile states" ON kingdom_tile_states;

-- Step 2: Create simpler, more permissive policies for testing
CREATE POLICY "Allow all authenticated users" ON kingdom_timers
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated users" ON kingdom_items
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated users" ON kingdom_tile_states
    FOR ALL USING (auth.role() = 'authenticated');

-- Step 3: Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename IN ('kingdom_timers', 'kingdom_items', 'kingdom_tile_states');

-- Step 4: Test if we can insert data
INSERT INTO kingdom_timers (user_id, timers_data) 
VALUES ('00000000-0000-0000-0000-000000000000', '{"test": "data"}')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO kingdom_items (user_id, items_data) 
VALUES ('00000000-0000-0000-0000-000000000000', '[]')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO kingdom_tile_states (user_id, states_data) 
VALUES ('00000000-0000-0000-0000-000000000000', '{"test": "state"}')
ON CONFLICT (user_id) DO NOTHING;

-- Step 5: Clean up test data
DELETE FROM kingdom_timers WHERE user_id = '00000000-0000-0000-0000-000000000000';
DELETE FROM kingdom_items WHERE user_id = '00000000-0000-0000-0000-000000000000';
DELETE FROM kingdom_tile_states WHERE user_id = '00000000-0000-0000-0000-000000000000';
