-- Add the missing build_tokens column to existing character_stats table
-- This will fix the 500 error when the API tries to save build_tokens

ALTER TABLE character_stats 
ADD COLUMN IF NOT EXISTS build_tokens INTEGER DEFAULT 0;

-- Verify the column was added
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'character_stats' 
AND column_name = 'build_tokens';

-- Update existing rows to have a default value
UPDATE character_stats 
SET build_tokens = 0 
WHERE build_tokens IS NULL;

-- Show the updated table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'character_stats' 
ORDER BY ordinal_position;
