-- Fix monster_spawns table schema to match API expectations
-- Drop the existing table with wrong schema
DROP TABLE IF EXISTS monster_spawns CASCADE;

-- Create monster_spawns table with correct structure
CREATE TABLE monster_spawns (
    id bigint primary key generated always as identity,
    user_id text not null, -- TEXT for Clerk authentication (not UUID)
    x integer not null,
    y integer not null,
    monster_type varchar(50) not null,
    spawned_at timestamp with time zone default now(),
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Enable RLS on monster_spawns
ALTER TABLE monster_spawns ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policies for monster_spawns
DROP POLICY IF EXISTS "monster_spawns_select_policy" ON monster_spawns;
CREATE POLICY "monster_spawns_select_policy" ON monster_spawns
    FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "monster_spawns_insert_policy" ON monster_spawns;
CREATE POLICY "monster_spawns_insert_policy" ON monster_spawns
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "monster_spawns_update_policy" ON monster_spawns;
CREATE POLICY "monster_spawns_update_policy" ON monster_spawns
    FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "monster_spawns_delete_policy" ON monster_spawns;
CREATE POLICY "monster_spawns_delete_policy" ON monster_spawns
    FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Create indexes for monster_spawns
CREATE INDEX IF NOT EXISTS idx_monster_spawns_user_id ON monster_spawns(user_id);
CREATE INDEX IF NOT EXISTS idx_monster_spawns_coordinates ON monster_spawns(x, y);

-- Grant permissions for monster_spawns
GRANT ALL ON monster_spawns TO authenticated;

-- Verify the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'monster_spawns' 
ORDER BY ordinal_position; 