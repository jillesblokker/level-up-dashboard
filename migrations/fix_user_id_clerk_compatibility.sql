-- Fix user_id type mismatch for Clerk compatibility
-- Clerk IDs (e.g., 'user_2z5XXhrBfLdbU0P6AUCBco0CJWC') are NOT UUIDs
-- All tables must use TEXT for user_id
-- 1. Fix titles system
ALTER TABLE IF EXISTS user_titles DROP CONSTRAINT IF EXISTS user_titles_user_id_fkey;
ALTER TABLE IF EXISTS user_titles
ALTER COLUMN user_id TYPE TEXT;
-- 2. Fix active_modifiers
ALTER TABLE IF EXISTS active_modifiers DROP CONSTRAINT IF EXISTS active_modifiers_user_id_fkey;
ALTER TABLE IF EXISTS active_modifiers
ALTER COLUMN user_id TYPE TEXT;
-- 3. Fix dungeon_runs
ALTER TABLE IF EXISTS dungeon_runs DROP CONSTRAINT IF EXISTS dungeon_runs_user_id_fkey;
ALTER TABLE IF EXISTS dungeon_runs
ALTER COLUMN user_id TYPE TEXT;
-- 4. Disable RLS for compatibility with Clerk (as seen in master_setup.sql)
-- Note: supabaseServer uses service_role key which bypasses RLS anyway
ALTER TABLE IF EXISTS titles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_titles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS active_modifiers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS dungeon_runs DISABLE ROW LEVEL SECURITY;