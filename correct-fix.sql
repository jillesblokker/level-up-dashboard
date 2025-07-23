-- CORRECTED Fix Data Persistence Issues
-- This script fixes the data type mismatches and ensures proper table structure
-- Clerk uses TEXT user IDs, not UUID

-- Step 1: Drop the incorrect tables (if they exist)
DROP TABLE IF EXISTS quest_favorites CASCADE;
DROP TABLE IF EXISTS kingdom_grid CASCADE;
DROP TABLE IF EXISTS kingdom_grids CASCADE;

-- Step 2: Create quest_favorites table with correct TEXT data types for Clerk
CREATE TABLE quest_favorites (
    id bigint primary key generated always as identity,
    user_id text not null,
    quest_id text not null,
    favorited_at timestamp with time zone default now(),
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Step 3: Create kingdom_grid table with correct TEXT data types for Clerk
CREATE TABLE kingdom_grid (
    id bigint primary key generated always as identity,
    user_id text not null,
    grid jsonb not null default '[]'::jsonb,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Step 4: Add unique constraints
ALTER TABLE quest_favorites ADD CONSTRAINT quest_favorites_user_quest_unique UNIQUE (user_id, quest_id);
ALTER TABLE kingdom_grid ADD CONSTRAINT kingdom_grid_user_unique UNIQUE (user_id);

-- Step 5: Enable RLS
ALTER TABLE quest_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE kingdom_grid ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies for quest_favorites (using TEXT auth.uid())
CREATE POLICY "quest_favorites_select_policy" ON quest_favorites FOR SELECT TO authenticated USING (user_id = auth.uid()::text);
CREATE POLICY "quest_favorites_insert_policy" ON quest_favorites FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "quest_favorites_update_policy" ON quest_favorites FOR UPDATE TO authenticated USING (user_id = auth.uid()::text) WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "quest_favorites_delete_policy" ON quest_favorites FOR DELETE TO authenticated USING (user_id = auth.uid()::text);

-- Step 7: Create RLS policies for kingdom_grid (using TEXT auth.uid())
CREATE POLICY "kingdom_grid_select_policy" ON kingdom_grid FOR SELECT TO authenticated USING (user_id = auth.uid()::text);
CREATE POLICY "kingdom_grid_insert_policy" ON kingdom_grid FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "kingdom_grid_update_policy" ON kingdom_grid FOR UPDATE TO authenticated USING (user_id = auth.uid()::text) WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "kingdom_grid_delete_policy" ON kingdom_grid FOR DELETE TO authenticated USING (user_id = auth.uid()::text);

-- Step 8: Create indexes
CREATE INDEX idx_quest_favorites_user_id ON quest_favorites(user_id);
CREATE INDEX idx_quest_favorites_quest_id ON quest_favorites(quest_id);
CREATE INDEX idx_kingdom_grid_user_id ON kingdom_grid(user_id);

-- Step 9: Grant permissions
GRANT ALL ON quest_favorites TO authenticated;
GRANT ALL ON kingdom_grid TO authenticated;

-- Step 10: Test the setup (this will be cleaned up by RLS)
-- Note: Using a sample Clerk-style user ID format
INSERT INTO quest_favorites (user_id, quest_id) VALUES 
('user_2abc123def456', 'test-quest-1'),
('user_2abc123def456', 'test-quest-2')
ON CONFLICT (user_id, quest_id) DO NOTHING;

INSERT INTO kingdom_grid (user_id, grid) VALUES 
('user_2abc123def456', '[{"x": 0, "y": 0, "tile": "castle"}]'::jsonb)
ON CONFLICT (user_id) DO NOTHING;

-- Step 11: Clean up test data
DELETE FROM quest_favorites WHERE user_id = 'user_2abc123def456';
DELETE FROM kingdom_grid WHERE user_id = 'user_2abc123def456'; 