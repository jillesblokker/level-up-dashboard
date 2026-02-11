CREATE TABLE IF NOT EXISTS dungeon_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    dungeon_id TEXT NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    loot_obtained JSONB,
    gold_earned INTEGER DEFAULT 0,
    xp_earned INTEGER DEFAULT 0
);
ALTER TABLE dungeon_runs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own dungeon runs" ON dungeon_runs;
CREATE POLICY "Users can view their own dungeon runs" ON dungeon_runs FOR
SELECT USING (auth.uid() = user_id);
-- Optional: Add index for performance
CREATE INDEX IF NOT EXISTS idx_dungeon_runs_user_id ON dungeon_runs(user_id);