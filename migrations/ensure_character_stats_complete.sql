-- Ensure character_stats table has all necessary columns
-- This migration adds missing columns if they don't exist
-- Add display_name column if missing
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'character_stats'
        AND column_name = 'display_name'
) THEN
ALTER TABLE character_stats
ADD COLUMN display_name TEXT DEFAULT 'Adventurer';
RAISE NOTICE 'Added display_name column';
END IF;
END $$;
-- Add character_name column if missing (legacy)
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'character_stats'
        AND column_name = 'character_name'
) THEN
ALTER TABLE character_stats
ADD COLUMN character_name TEXT DEFAULT 'Adventurer';
RAISE NOTICE 'Added character_name column';
END IF;
END $$;
-- Add title column if missing
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'character_stats'
        AND column_name = 'title'
) THEN
ALTER TABLE character_stats
ADD COLUMN title TEXT DEFAULT 'Novice';
RAISE NOTICE 'Added title column';
END IF;
END $$;
-- Add stats_data JSONB column if missing (for flexible storage)
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'character_stats'
        AND column_name = 'stats_data'
) THEN
ALTER TABLE character_stats
ADD COLUMN stats_data JSONB DEFAULT '{}';
RAISE NOTICE 'Added stats_data column';
END IF;
END $$;
-- Add streak_tokens column if missing
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'character_stats'
        AND column_name = 'streak_tokens'
) THEN
ALTER TABLE character_stats
ADD COLUMN streak_tokens INTEGER DEFAULT 0;
RAISE NOTICE 'Added streak_tokens column';
END IF;
END $$;
-- Add kingdom_expansions column if missing
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'character_stats'
        AND column_name = 'kingdom_expansions'
) THEN
ALTER TABLE character_stats
ADD COLUMN kingdom_expansions INTEGER DEFAULT 0;
RAISE NOTICE 'Added kingdom_expansions column';
END IF;
END $$;
-- Ensure streaks table exists (used by character-stats API)
CREATE TABLE IF NOT EXISTS streaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);
-- Enable RLS on streaks if not already
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
-- Create RLS policy for streaks
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'streaks'
        AND policyname = 'Users can manage own streaks'
) THEN CREATE POLICY "Users can manage own streaks" ON streaks FOR ALL USING (
    user_id = current_setting('request.jwt.claim.sub', true)
);
END IF;
END $$;