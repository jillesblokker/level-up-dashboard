-- Recreate rare_tiles table with proper sequence and permissions
-- Drop the existing table if it exists
DROP TABLE IF EXISTS rare_tiles CASCADE;

-- Create the table with proper sequence
CREATE TABLE rare_tiles (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  tile_id TEXT NOT NULL,
  unlocked BOOLEAN DEFAULT FALSE,
  quantity INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, tile_id)
);

-- Grant permissions to service_role
GRANT ALL PRIVILEGES ON TABLE rare_tiles TO service_role;
GRANT USAGE, SELECT ON SEQUENCE rare_tiles_id_seq TO service_role;

-- Grant permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE rare_tiles TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE rare_tiles_id_seq TO authenticated;

-- Add RLS policies
ALTER TABLE rare_tiles ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read their own rare tiles
CREATE POLICY "Users can view their own rare tiles" ON rare_tiles
  FOR SELECT USING (auth.uid()::text = user_id);

-- Policy to allow users to insert their own rare tiles
CREATE POLICY "Users can insert their own rare tiles" ON rare_tiles
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Policy to allow users to update their own rare tiles
CREATE POLICY "Users can update their own rare tiles" ON rare_tiles
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Policy to allow users to delete their own rare tiles
CREATE POLICY "Users can delete their own rare tiles" ON rare_tiles
  FOR DELETE USING (auth.uid()::text = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rare_tiles_user_id ON rare_tiles(user_id);
CREATE INDEX IF NOT EXISTS idx_rare_tiles_tile_id ON rare_tiles(tile_id); 