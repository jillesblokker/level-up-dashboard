-- Simple Step-by-Step Migration for Level-Up Dashboard
-- Run these commands one by one to avoid errors

-- Step 1: Create kingdom_timers table
CREATE TABLE IF NOT EXISTS kingdom_timers (
    user_id UUID PRIMARY KEY,
    timers_data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create kingdom_items table  
CREATE TABLE IF NOT EXISTS kingdom_items (
    user_id UUID PRIMARY KEY,
    items_data JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create kingdom_tile_states table
CREATE TABLE IF NOT EXISTS kingdom_tile_states (
    user_id UUID PRIMARY KEY,
    states_data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Enable RLS on kingdom_timers
ALTER TABLE kingdom_timers ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policy for kingdom_timers
CREATE POLICY "Users can view own kingdom timers" ON kingdom_timers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own kingdom timers" ON kingdom_timers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own kingdom timers" ON kingdom_timers
    FOR UPDATE USING (auth.uid() = user_id);

-- Step 6: Enable RLS on kingdom_items
ALTER TABLE kingdom_items ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policy for kingdom_items
CREATE POLICY "Users can view own kingdom items" ON kingdom_items
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own kingdom items" ON kingdom_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own kingdom items" ON kingdom_items
    FOR UPDATE USING (auth.uid() = user_id);

-- Step 8: Enable RLS on kingdom_tile_states
ALTER TABLE kingdom_tile_states ENABLE ROW LEVEL SECURITY;

-- Step 9: Create RLS policy for kingdom_tile_states
CREATE POLICY "Users can view own kingdom tile states" ON kingdom_tile_states
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own kingdom tile states" ON kingdom_tile_states
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own kingdom tile states" ON kingdom_tile_states
    FOR UPDATE USING (auth.uid() = user_id);

-- Step 10: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_kingdom_timers_user_id ON kingdom_timers(user_id);
CREATE INDEX IF NOT EXISTS idx_kingdom_items_user_id ON kingdom_items(user_id);
CREATE INDEX IF NOT EXISTS idx_kingdom_tile_states_user_id ON kingdom_tile_states(user_id);

-- Step 11: Grant permissions
GRANT ALL ON kingdom_timers TO authenticated;
GRANT ALL ON kingdom_items TO authenticated;
GRANT ALL ON kingdom_tile_states TO authenticated;

-- Step 12: Verify tables were created
SELECT 'kingdom_timers' as table_name, COUNT(*) as row_count FROM kingdom_timers
UNION ALL
SELECT 'kingdom_items' as table_name, COUNT(*) as row_count FROM kingdom_items
UNION ALL
SELECT 'kingdom_tile_states' as table_name, COUNT(*) as row_count FROM kingdom_tile_states;
