-- Migration: Add original_completion_date column to preserve historical completion data
-- This allows daily resets without losing historical statistics

-- Add column to quest_completion table
ALTER TABLE quest_completion 
ADD COLUMN IF NOT EXISTS original_completion_date TIMESTAMPTZ;

-- Add column to challenge_completion table  
ALTER TABLE challenge_completion 
ADD COLUMN IF NOT EXISTS original_completion_date DATE;

-- Add column to milestone_completion table
ALTER TABLE milestone_completion 
ADD COLUMN IF NOT EXISTS original_completion_date DATE;

-- Update existing records to set original_completion_date
-- For quest_completion, use completed_at as the original date
UPDATE quest_completion 
SET original_completion_date = completed_at 
WHERE completed = true 
AND original_completion_date IS NULL;

-- For challenge_completion, use date as the original date
UPDATE challenge_completion 
SET original_completion_date = date 
WHERE completed = true 
AND original_completion_date IS NULL;

-- For milestone_completion, use date as the original date
UPDATE milestone_completion 
SET original_completion_date = date 
WHERE completed = true 
AND original_completion_date IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quest_completion_original_date 
ON quest_completion(original_completion_date);

CREATE INDEX IF NOT EXISTS idx_challenge_completion_original_date 
ON challenge_completion(original_completion_date);

CREATE INDEX IF NOT EXISTS idx_milestone_completion_original_date 
ON milestone_completion(original_completion_date);

-- Verify the changes
SELECT 
    'quest_completion' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN completed = true THEN 1 END) as completed_records,
    COUNT(CASE WHEN original_completion_date IS NOT NULL THEN 1 END) as with_original_date
FROM quest_completion
UNION ALL
SELECT 
    'challenge_completion' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN completed = true THEN 1 END) as completed_records,
    COUNT(CASE WHEN original_completion_date IS NOT NULL THEN 1 END) as with_original_date
FROM challenge_completion
UNION ALL
SELECT 
    'milestone_completion' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN completed = true THEN 1 END) as completed_records,
    COUNT(CASE WHEN original_completion_date IS NOT NULL THEN 1 END) as with_original_date
FROM milestone_completion;
