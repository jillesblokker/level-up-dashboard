-- Add mastery mandate columns to quests and challenges
-- First, ensure the columns exist
ALTER TABLE quests
ADD COLUMN IF NOT EXISTS mandate_period TEXT DEFAULT 'daily';
ALTER TABLE quests
ADD COLUMN IF NOT EXISTS mandate_count INTEGER DEFAULT 1;
-- Wrap update in a block to handle missing recurrence_interval column
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'quests'
        AND column_name = 'recurrence_interval'
) THEN
UPDATE quests
SET mandate_period = recurrence_interval
WHERE recurrence_interval IS NOT NULL
    AND recurrence_interval != 'none';
END IF;
END $$;
ALTER TABLE challenges
ADD COLUMN IF NOT EXISTS mandate_period TEXT DEFAULT 'daily';
ALTER TABLE challenges
ADD COLUMN IF NOT EXISTS mandate_count INTEGER DEFAULT 1;
-- Ensure constraints (handled with check for existing constraints to avoid errors on reruns)
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.constraint_column_usage
    WHERE constraint_name = 'check_mandate_count_positive'
) THEN
ALTER TABLE quests
ADD CONSTRAINT check_mandate_count_positive CHECK (mandate_count >= 1);
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.constraint_column_usage
    WHERE constraint_name = 'check_challenge_mandate_count_positive'
) THEN
ALTER TABLE challenges
ADD CONSTRAINT check_challenge_mandate_count_positive CHECK (mandate_count >= 1);
END IF;
END $$;