-- ==========================================
-- CLEAN UP QUEST_COMPLETION TABLE
-- Date: 2025-08-28
-- Purpose: Simplify quest completion data model for clear progress tracking
-- ==========================================

-- 1. First, let's see what we're working with
DO $$ 
BEGIN
    RAISE NOTICE 'Starting quest completion table cleanup...';
END $$;

-- 2. Remove confusing records where completed = false but have timestamps
-- These records don't make sense for progress tracking
DELETE FROM quest_completion 
WHERE completed = false 
    AND (completed_at IS NOT NULL OR xp_earned > 0 OR gold_earned > 0);

-- 3. Ensure all completed quests have proper data
UPDATE quest_completion 
SET 
    xp_earned = COALESCE(xp_earned, 50),
    gold_earned = COALESCE(gold_earned, 25),
    completed_at = COALESCE(completed_at, created_at)
WHERE completed = true 
    AND (xp_earned IS NULL OR xp_earned = 0)
    AND (gold_earned IS NULL OR gold_earned = 0);

-- 4. Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add original_completion_date if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'quest_completion' AND column_name = 'original_completion_date'
    ) THEN
        ALTER TABLE public.quest_completion ADD COLUMN original_completion_date TIMESTAMPTZ;
        RAISE NOTICE 'Added original_completion_date column';
    END IF;
    
    -- Add progress_notes if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'quest_completion' AND column_name = 'progress_notes'
    ) THEN
        ALTER TABLE public.quest_completion ADD COLUMN progress_notes TEXT;
        RAISE NOTICE 'Added progress_notes column';
    END IF;
END $$;

-- 5. Set original_completion_date for existing completed quests
UPDATE quest_completion 
SET original_completion_date = completed_at 
WHERE completed = true 
    AND original_completion_date IS NULL;

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quest_completion_user_date 
ON quest_completion(user_id, completed_at) 
WHERE completed = true;

CREATE INDEX IF NOT EXISTS idx_quest_completion_original_date 
ON quest_completion(user_id, original_completion_date) 
WHERE completed = true;

-- 7. Verify the cleanup
DO $$ 
DECLARE
    total_records INTEGER;
    completed_records INTEGER;
    clean_records INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_records FROM quest_completion;
    SELECT COUNT(*) INTO completed_records FROM quest_completion WHERE completed = true;
    SELECT COUNT(*) INTO clean_records FROM quest_completion 
        WHERE completed = true 
            AND completed_at IS NOT NULL 
            AND xp_earned > 0 
            AND gold_earned > 0;
    
    RAISE NOTICE 'Cleanup complete!';
    RAISE NOTICE 'Total records: %', total_records;
    RAISE NOTICE 'Completed records: %', completed_records;
    RAISE NOTICE 'Clean completed records: %', clean_records;
END $$;
