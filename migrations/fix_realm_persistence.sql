-- Fix Realm Persistence by switching to a normalized realm_tiles table
-- 1. Create normalized realm_tiles table
-- This replaces the fragile JSON blob or pivoted table approach
DROP TABLE IF EXISTS realm_tiles;
CREATE TABLE IF NOT EXISTS realm_tiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    tile_type INTEGER NOT NULL,
    event_type TEXT,
    meta JSONB DEFAULT '{}'::jsonb,
    -- For things like 'hasMonster', 'cityName'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, x, y)
);
ALTER TABLE realm_tiles DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_realm_tiles_user ON realm_tiles(user_id);