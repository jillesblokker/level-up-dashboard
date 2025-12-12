
-- Create creature_interactions table to track interactions
CREATE TABLE IF NOT EXISTS creature_interactions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id TEXT NOT NULL,
  creature_definition_id TEXT NOT NULL, -- '001', '002', etc.
  creature_instance_id TEXT, -- Optional, if we want to track specific instances
  interaction_type TEXT NOT NULL DEFAULT 'shave', -- 'shave', 'pet', 'feed', etc.
  occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Add a constraint to maybe limit interactions? For now just tracking history.
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE creature_interactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own interactions
CREATE POLICY "Users can view their own creature interactions" ON creature_interactions
  FOR SELECT USING (auth.uid()::text = user_id);

-- Policy: Users can insert their own interactions
CREATE POLICY "Users can insert their own creature interactions" ON creature_interactions
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Create an index for faster lookups of recent interactions
CREATE INDEX idx_creature_interactions_user_date ON creature_interactions(user_id, occurred_at DESC);
