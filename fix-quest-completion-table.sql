-- ==========================================
-- FIX QUEST_COMPLETION TABLE STRUCTURE
-- Run this in your Supabase SQL Editor
-- ==========================================

-- 1. First, let's see what columns actually exist in the table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'quest_completion' 
ORDER BY ordinal_position;

-- 2. Add missing columns to quest_completion table
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

-- 3. Update existing completed quests with default rewards
UPDATE public.quest_completion 
SET 
    xp_earned = 50,
    gold_earned = 25
WHERE completed = true 
    AND (xp_earned IS NULL OR xp_earned = 0)
    AND (gold_earned IS NULL OR gold_earned = 0);

-- 4. Verify the updated table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'quest_completion' 
ORDER BY ordinal_position;

-- 5. Check if there are any completed quests with rewards (only using columns that exist)
SELECT 
    id,
    user_id,
    quest_id,
    completed,
    completed_at,
    xp_earned,
    gold_earned
FROM public.quest_completion 
WHERE completed = true 
ORDER BY completed_at DESC 
LIMIT 10;

-- 6. Show a summary of rewards by user
SELECT 
    user_id,
    COUNT(*) as completed_quests,
    SUM(xp_earned) as total_xp_earned,
    SUM(gold_earned) as total_gold_earned
FROM public.quest_completion 
WHERE completed = true 
GROUP BY user_id
ORDER BY total_xp_earned DESC;
