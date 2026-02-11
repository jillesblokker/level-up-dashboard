-- Create meditations table
CREATE TABLE IF NOT EXISTS meditations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Ensure RLS is disabled or open for now (matches other tables like 'streaks')
ALTER TABLE meditations DISABLE ROW LEVEL SECURITY;
-- Fix existing dungeon runs without status
UPDATE dungeon_runs
SET status = 'completed'
WHERE status IS NULL;