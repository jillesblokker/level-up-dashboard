-- Add Kingdom Economy Columns and Tables
-- 1. Add streak_tokens to character_stats
ALTER TABLE character_stats
ADD COLUMN IF NOT EXISTS streak_tokens INTEGER DEFAULT 0;
-- 2. Add build_tokens (if missing)
ALTER TABLE character_stats
ADD COLUMN IF NOT EXISTS build_tokens INTEGER DEFAULT 0;
-- 3. Create Kingdom Tile Inventory Table
-- Stores the quantity of unplaced tiles owned by the user
CREATE TABLE IF NOT EXISTS kingdom_tile_inventory (
    user_id TEXT NOT NULL,
    tile_id TEXT NOT NULL,
    quantity INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, tile_id)
);
-- 4. Enable RLS (though typically disabled in this setup, keeping consistency)
ALTER TABLE kingdom_tile_inventory DISABLE ROW LEVEL SECURITY;
-- 5. Create index for performance
CREATE INDEX IF NOT EXISTS idx_kingdom_tile_inventory_user_id ON kingdom_tile_inventory(user_id);
SELECT 'Kingdom Economy migration completed successfully' as status;