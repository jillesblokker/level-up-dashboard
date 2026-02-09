-- Shiny Inventory Items Migration
-- Adds star rating to equipment and consumables (inventory_items table)
-- Step 1: Add star_rating column
ALTER TABLE inventory_items
ADD COLUMN IF NOT EXISTS star_rating INTEGER DEFAULT 0;
-- Step 2: Add constraint for valid ratings (0-3)
-- 0 = Standard
-- 1 = Polished (+10% Stats)
-- 2 = Gleaming (+25% Stats)
-- 3 = Radiant (+50% Stats)
ALTER TABLE inventory_items DROP CONSTRAINT IF EXISTS inventory_items_star_rating_check;
ALTER TABLE inventory_items
ADD CONSTRAINT inventory_items_star_rating_check CHECK (
        star_rating >= 0
        AND star_rating <= 3
    );
-- Step 3: Index for sorting/filtering
CREATE INDEX IF NOT EXISTS idx_inventory_items_star_rating ON inventory_items(star_rating);
-- Step 4: Comment
COMMENT ON COLUMN inventory_items.star_rating IS 'Shiny Tier: 0=Std, 1=Polished, 2=Gleaming, 3=Radiant';