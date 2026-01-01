CREATE TABLE IF NOT EXISTS dungeon_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (
        status IN (
            'in_progress',
            'completed',
            'defeated',
            'abandoned'
        )
    ),
    current_room INTEGER DEFAULT 1,
    max_rooms INTEGER DEFAULT 5,
    /* Default length of a run */
    current_hp INTEGER NOT NULL,
    max_hp INTEGER NOT NULL,
    loot_collected JSONB DEFAULT '[]'::jsonb,
    history JSONB DEFAULT '[]'::jsonb,
    /* Metadata for restoring state */
    current_encounter JSONB DEFAULT NULL
);
CREATE INDEX IF NOT EXISTS idx_dungeon_runs_user_status ON dungeon_runs(user_id, status);
/* RLS Policies */
ALTER TABLE dungeon_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own dungeon runs" ON dungeon_runs FOR
SELECT USING (
        user_id = current_setting('request.jwt.claim.sub', true)
    );
CREATE POLICY "Users can insert own dungeon runs" ON dungeon_runs FOR
INSERT WITH CHECK (
        user_id = current_setting('request.jwt.claim.sub', true)
    );
CREATE POLICY "Users can update own dungeon runs" ON dungeon_runs FOR
UPDATE USING (
        user_id = current_setting('request.jwt.claim.sub', true)
    );