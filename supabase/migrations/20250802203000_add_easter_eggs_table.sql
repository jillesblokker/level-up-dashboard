-- Create easter_eggs table
CREATE TABLE IF NOT EXISTS easter_eggs (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  egg_id TEXT NOT NULL,
  found BOOLEAN DEFAULT FALSE,
  found_at TIMESTAMP WITH TIME ZONE,
  position JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, egg_id)
);

-- Grant permissions to service_role
GRANT ALL PRIVILEGES ON TABLE easter_eggs TO service_role;
GRANT USAGE, SELECT ON SEQUENCE easter_eggs_id_seq TO service_role;

-- Grant permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE easter_eggs TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE easter_eggs_id_seq TO authenticated;

-- Add RLS policies
ALTER TABLE easter_eggs ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view their own eggs
CREATE POLICY "Users can view their own easter eggs" ON easter_eggs
  FOR SELECT USING (auth.uid()::text = user_id);

-- Policy to allow users to insert their own eggs
CREATE POLICY "Users can insert their own easter eggs" ON easter_eggs
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Policy to allow users to update their own eggs
CREATE POLICY "Users can update their own easter eggs" ON easter_eggs
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Policy to allow users to delete their own eggs
CREATE POLICY "Users can delete their own easter eggs" ON easter_eggs
  FOR DELETE USING (auth.uid()::text = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_easter_eggs_user_id ON easter_eggs(user_id);
CREATE INDEX IF NOT EXISTS idx_easter_eggs_egg_id ON easter_eggs(egg_id);
CREATE INDEX IF NOT EXISTS idx_easter_eggs_found ON easter_eggs(found); 