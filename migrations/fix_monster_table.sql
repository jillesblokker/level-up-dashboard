CREATE TABLE IF NOT EXISTS monster_spawns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    monster_type TEXT NOT NULL,
    spawned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Add columns safely if they don't exist
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'monster_spawns'
        AND column_name = 'defeated'
) THEN
ALTER TABLE monster_spawns
ADD COLUMN defeated BOOLEAN DEFAULT FALSE;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'monster_spawns'
        AND column_name = 'reward_claimed'
) THEN
ALTER TABLE monster_spawns
ADD COLUMN reward_claimed BOOLEAN DEFAULT FALSE;
END IF;
END $$;
ALTER TABLE monster_spawns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own monster spawns" ON monster_spawns;
CREATE POLICY "Users can manage their own monster spawns" ON monster_spawns USING (user_id = auth.uid()::text) WITH CHECK (user_id = auth.uid()::text);
CREATE INDEX IF NOT EXISTS idx_monster_spawns_user_active ON monster_spawns(user_id, defeated)
WHERE defeated = false;