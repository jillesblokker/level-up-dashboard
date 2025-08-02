-- Create rare_tiles table
CREATE TABLE IF NOT EXISTS rare_tiles (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tile_id TEXT NOT NULL,
  unlocked BOOLEAN DEFAULT FALSE,
  quantity INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, tile_id)
);

-- Add RLS policies
ALTER TABLE rare_tiles ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read their own rare tiles
CREATE POLICY "Users can view their own rare tiles" ON rare_tiles
  FOR SELECT USING (auth.uid() = user_id);

-- Policy to allow users to insert their own rare tiles
CREATE POLICY "Users can insert their own rare tiles" ON rare_tiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own rare tiles
CREATE POLICY "Users can update their own rare tiles" ON rare_tiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy to allow users to delete their own rare tiles
CREATE POLICY "Users can delete their own rare tiles" ON rare_tiles
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_rare_tiles_user_id ON rare_tiles(user_id);
CREATE INDEX IF NOT EXISTS idx_rare_tiles_tile_id ON rare_tiles(tile_id); 