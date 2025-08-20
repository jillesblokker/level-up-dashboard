-- ==========================================
-- FIX QUEST_COMPLETION TABLE STRUCTURE
-- Run this in your Supabase SQL Editor
-- ==========================================

-- 1. Add missing columns to quest_completion table
DO $$ 
BEGIN
    -- Add xp_earned column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'quest_completion' AND column_name = 'xp_earned'
    ) THEN
        ALTER TABLE public.quest_completion ADD COLUMN xp_earned INTEGER DEFAULT 0;
        RAISE NOTICE 'Added xp_earned column to quest_completion table';
    ELSE
        RAISE NOTICE 'xp_earned column already exists';
    END IF;
    
    -- Add gold_earned column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'quest_completion' AND column_name = 'gold_earned'
    ) THEN
        ALTER TABLE public.quest_completion ADD COLUMN gold_earned INTEGER DEFAULT 0;
        RAISE NOTICE 'Added gold_earned column to quest_completion table';
    ELSE
        RAISE NOTICE 'gold_earned column already exists';
    END IF;
END $$;

-- 2. Update existing completed quests with default rewards
UPDATE public.quest_completion 
SET 
    xp_earned = 50,
    gold_earned = 25
WHERE completed = true 
    AND (xp_earned IS NULL OR xp_earned = 0)
    AND (gold_earned IS NULL OR gold_earned = 0);

-- 3. Verify the table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'quest_completion' 
ORDER BY ordinal_position;

-- 4. Check if there are any completed quests with rewards
SELECT 
    id,
    user_id,
    quest_id,
    completed,
    completed_at,
    xp_earned,
    gold_earned,
    created_at
FROM public.quest_completion 
WHERE completed = true 
ORDER BY completed_at DESC 
LIMIT 10;
