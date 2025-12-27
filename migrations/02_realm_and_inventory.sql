-- Create realm_grids table
CREATE TABLE IF NOT EXISTS realm_grids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    grid_data JSONB DEFAULT '[]'::jsonb,
    is_current BOOLEAN DEFAULT false,
    character_position JSONB DEFAULT '{"x": 6, "y": 3}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Index for realm_grids
CREATE INDEX IF NOT EXISTS idx_realm_grids_user_current ON realm_grids(user_id, is_current);
-- Create tile_inventory table
CREATE TABLE IF NOT EXISTS tile_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    tile_id TEXT,
    -- Use this for specific instance IDs if needed, or map to tile_type
    tile_type TEXT NOT NULL,
    name TEXT,
    quantity INTEGER DEFAULT 0,
    cost INTEGER DEFAULT 0,
    connections JSONB DEFAULT '[]'::jsonb,
    rotation INTEGER DEFAULT 0,
    version INTEGER DEFAULT 1,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, tile_type) -- Ensure uniqueness for simple inventory
);
-- Index for tile_inventory
CREATE INDEX IF NOT EXISTS idx_tile_inventory_user ON tile_inventory(user_id);
-- Create game_settings table
CREATE TABLE IF NOT EXISTS game_settings (
    user_id TEXT PRIMARY KEY,
    -- One settings row per user
    settings_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Create image_descriptions table
CREATE TABLE IF NOT EXISTS image_descriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    image_path TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, image_path)
);
-- Disable RLS for all these new tables to allow service key access without hassle
-- (The API handles auth via Clerk before querying)
ALTER TABLE realm_grids DISABLE ROW LEVEL SECURITY;
ALTER TABLE tile_inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE game_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE image_descriptions DISABLE ROW LEVEL SECURITY;