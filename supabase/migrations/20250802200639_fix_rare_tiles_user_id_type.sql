-- Fix rare_tiles table to use TEXT for user_id (Clerk authentication)
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view their own rare tiles" ON rare_tiles;
DROP POLICY IF EXISTS "Users can insert their own rare tiles" ON rare_tiles;
DROP POLICY IF EXISTS "Users can update their own rare tiles" ON rare_tiles;
DROP POLICY IF EXISTS "Users can delete their own rare tiles" ON rare_tiles;

-- Change user_id column from UUID to TEXT
ALTER TABLE rare_tiles ALTER COLUMN user_id TYPE TEXT;

-- Remove the foreign key constraint since auth.users might not exist or be compatible
ALTER TABLE rare_tiles DROP CONSTRAINT IF EXISTS rare_tiles_user_id_fkey;

-- Recreate RLS policies for TEXT user_id
CREATE POLICY "Users can view their own rare tiles" ON rare_tiles
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own rare tiles" ON rare_tiles
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own rare tiles" ON rare_tiles
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own rare tiles" ON rare_tiles
  FOR DELETE USING (auth.uid()::text = user_id);
