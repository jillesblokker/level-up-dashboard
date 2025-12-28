CREATE TABLE IF NOT EXISTS monster_spawns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    monster_type TEXT NOT NULL,
    spawned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    defeated BOOLEAN DEFAULT FALSE,
    reward_claimed BOOLEAN DEFAULT FALSE
);
ALTER TABLE monster_spawns DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_monster_spawns_user_active ON monster_spawns(user_id, defeated)
WHERE defeated = false;