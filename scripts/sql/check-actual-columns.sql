-- Check what columns actually exist in the game_settings table
-- This will show us the real table structure

-- 1. Check if the table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'game_settings'
) as table_exists;

-- 2. Show all columns that actually exist
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'game_settings' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Show any data in the table
SELECT COUNT(*) as total_rows FROM public.game_settings;

-- 4. Show sample data (if any exists)
SELECT * FROM public.game_settings LIMIT 3;
