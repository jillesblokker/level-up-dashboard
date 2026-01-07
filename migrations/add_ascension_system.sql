-- Add Ascension Level to Character Stats
-- This tracks how many times the user has 'prestiged' (reset for rewards)
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'character_stats'
        AND column_name = 'ascension_level'
) THEN
ALTER TABLE character_stats
ADD COLUMN ascension_level INTEGER DEFAULT 0;
END IF;
END $$;