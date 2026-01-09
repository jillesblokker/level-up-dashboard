-- Shiny Items System Migration
-- Adds star rating (0-3) to inventory items for rarity tiers
-- Step 1: Add star_rating column to tile_inventory
ALTER TABLE tile_inventory
ADD COLUMN IF NOT EXISTS star_rating INTEGER DEFAULT 0;
-- Step 2: Add constraint to ensure valid star ratings (0-3)
ALTER TABLE tile_inventory DROP CONSTRAINT IF EXISTS tile_inventory_star_rating_check;
ALTER TABLE tile_inventory
ADD CONSTRAINT tile_inventory_star_rating_check CHECK (
        star_rating >= 0
        AND star_rating <= 3
    );
-- Step 3: Create index for efficient queries by rarity
CREATE INDEX IF NOT EXISTS idx_tile_inventory_star_rating ON tile_inventory(star_rating);
-- Step 4: Set existing items to 0 stars (normal)
UPDATE tile_inventory
SET star_rating = 0
WHERE star_rating IS NULL;
-- Step 5: Create item_discoveries table to track first finds of each rarity
CREATE TABLE IF NOT EXISTS item_discoveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    item_type TEXT NOT NULL,
    star_rating INTEGER NOT NULL CHECK (
        star_rating >= 0
        AND star_rating <= 3
    ),
    discovered_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, item_type, star_rating)
);
-- Enable RLS on item_discoveries
ALTER TABLE item_discoveries ENABLE ROW LEVEL SECURITY;
-- RLS Policies for item_discoveries
DROP POLICY IF EXISTS "Users can view own discoveries" ON item_discoveries;
CREATE POLICY "Users can view own discoveries" ON item_discoveries FOR
SELECT USING (
        auth.uid()::text = user_id
        OR user_id = current_setting('app.current_user_id', true)
    );
DROP POLICY IF EXISTS "Users can insert own discoveries" ON item_discoveries;
CREATE POLICY "Users can insert own discoveries" ON item_discoveries FOR
INSERT WITH CHECK (
        auth.uid()::text = user_id
        OR user_id = current_setting('app.current_user_id', true)
    );
-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_item_discoveries_user_type ON item_discoveries(user_id, item_type);
COMMENT ON COLUMN tile_inventory.star_rating IS 'Rarity tier: 0=Normal (85%), 1=Uncommon (10%), 2=Rare (4%), 3=Legendary (1%)';