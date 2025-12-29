-- Ensure streaks table exists and has correct constraints
CREATE TABLE IF NOT EXISTS streaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    alliance_id TEXT,
    current_streak INTEGER DEFAULT 0,
    last_check_in TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Ensure RLS is disabled
ALTER TABLE streaks DISABLE ROW LEVEL SECURITY;
-- Handle the unique constraint. 
-- We drop it first to be safe, then add it back.
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'streaks_user_id_alliance_id_key'
) THEN
ALTER TABLE streaks DROP CONSTRAINT streaks_user_id_alliance_id_key;
END IF;
-- Also check for any other unique index on these columns just in case
-- (This part is harder to do safely in raw SQL without knowing the exact name, so we stick to the standard name)
END $$;
-- Add the unique constraint with a specific name we can rely on
ALTER TABLE streaks
ADD CONSTRAINT streaks_user_id_alliance_id_key UNIQUE (user_id, alliance_id);