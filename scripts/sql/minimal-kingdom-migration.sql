-- Minimal Kingdom Tables Migration
-- This only creates the tables we need for kingdom persistence

-- 1. Kingdom Grid Table (for kingdom layout persistence)
CREATE TABLE IF NOT EXISTS kingdom_grid (
    user_id UUID PRIMARY KEY,
    grid_data JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Kingdom Tile Timers Table (for tile cooldowns and timers)
CREATE TABLE IF NOT EXISTS kingdom_timers (
    user_id UUID PRIMARY KEY,
    timers_data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Kingdom Tile Items Table (for items stored in tiles)
CREATE TABLE IF NOT EXISTS kingdom_items (
    user_id UUID PRIMARY KEY,
    items_data JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Kingdom Tile States Table (for individual tile states)
CREATE TABLE IF NOT EXISTS kingdom_tile_states (
    user_id UUID PRIMARY KEY,
    states_data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_kingdom_grid_user_id ON kingdom_grid(user_id);
CREATE INDEX IF NOT EXISTS idx_kingdom_timers_user_id ON kingdom_timers(user_id);
CREATE INDEX IF NOT EXISTS idx_kingdom_items_user_id ON kingdom_items(user_id);
CREATE INDEX IF NOT EXISTS idx_kingdom_tile_states_user_id ON kingdom_tile_states(user_id);

-- 6. Enable RLS (Row Level Security) for all tables
ALTER TABLE kingdom_grid ENABLE ROW LEVEL SECURITY;
ALTER TABLE kingdom_timers ENABLE ROW LEVEL SECURITY;
ALTER TABLE kingdom_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE kingdom_tile_states ENABLE ROW LEVEL SECURITY;

-- 7. Create simple RLS policies (allow all authenticated users)
CREATE POLICY "Allow all authenticated users" ON kingdom_grid
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated users" ON kingdom_timers
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated users" ON kingdom_items
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated users" ON kingdom_tile_states
    FOR ALL USING (auth.role() = 'authenticated');

-- 8. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;

-- 9. Output confirmation
SELECT 'Minimal kingdom migration completed successfully!' as status;
