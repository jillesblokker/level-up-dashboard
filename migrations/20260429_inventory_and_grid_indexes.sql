-- 20260429_inventory_and_grid_indexes.sql
-- Optimized for inventory management and kingdom grid persistence

-- Index for tile inventory lookups
CREATE INDEX IF NOT EXISTS idx_tile_inventory_user_id ON tile_inventory(user_id);

-- Index for kingdom grid lookups
CREATE INDEX IF NOT EXISTS idx_kingdom_grid_user_id ON kingdom_grid(user_id);

-- Index for kingdom timers (if exists as a table)
-- Some systems use jsonb in kingdom_grid, but if timers are separate:
CREATE INDEX IF NOT EXISTS idx_property_timers_user_id ON property_timers(user_id) WHERE user_id IS NOT NULL;
